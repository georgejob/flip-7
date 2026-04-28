import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getGameState, subscribeToRoom, updateGameState } from '../game/supabase'
import * as round from '../game/round'

// Subscribes to a room's game_state and returns the current state plus
// action callbacks. Each action computes the new state locally (pure round
// functions) and writes it back via updateGameState — Supabase Realtime
// echoes the change to every other client.
//
// When the *local* player busts and that bust would end the round, the hook
// writes only the post-card / pre-end state ("paused") and exposes
// `pendingRoundEnd: true`. The UI keeps the bust modal up. When the user
// dismisses the modal, the UI calls `flushPendingRoundEnd()` to commit the
// round-end transition. A safety timeout in the UI also calls flush after
// 10s in case the user never acknowledges.
export function useGame(roomId, userId) {
  const [gameState, setGameState] = useState(null)
  const [room, setRoom] = useState(null)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)
  const [pendingRoundEnd, setPendingRoundEnd] = useState(false)

  useEffect(() => {
    if (!roomId) return
    let cancelled = false

    getGameState(roomId)
      .then(({ room }) => {
        if (cancelled) return
        setRoom(room)
        setGameState(room?.game_state ?? null)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('useGame: load failed', err)
        setError(err?.message ?? 'Failed to load game')
      })

    const unsubscribe = subscribeToRoom(roomId, {
      onRoomChange: (payload) => {
        if (payload.eventType === 'DELETE') {
          setRoom(null)
          setGameState(null)
        } else if (payload.new) {
          setRoom(payload.new)
          setGameState(payload.new.game_state ?? null)
        }
      },
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [roomId])

  // Writes a fully-computed next state to Supabase and updates local state.
  const writeState = useCallback(
    async (next) => {
      if (!roomId) return
      const status = next.status === 'finished' ? 'finished' : 'playing'
      await updateGameState(roomId, next, { status })
      setGameState(next)
    },
    [roomId],
  )

  // Wraps a state-mutator from round.js. Used for actions that always commit
  // immediately (stay, selectTarget, cancelPending).
  const apply = useCallback(
    async (mutator) => {
      if (!roomId || pending) return
      setPending(true)
      setError(null)
      try {
        const next = mutator(gameState)
        if (!next || next === gameState) return
        await writeState(next)
      } catch (err) {
        console.error('useGame: action failed', err)
        setError(err?.message ?? 'Action failed')
      } finally {
        setPending(false)
      }
    },
    [roomId, gameState, pending, writeState],
  )

  const hit = useCallback(async () => {
    if (!roomId || pending || !gameState) return
    setPending(true)
    setError(null)
    try {
      const intermediate = round.hitDeferred(gameState)
      if (intermediate === gameState) return

      const ld = intermediate.lastDrawn
      const isOurs = userId && ld?.playerId === userId
      const localBust = isOurs && ld?.result === 'busted'
      const localFlip7 = isOurs && ld?.result === 'flip7'
      const ending = round.wouldEndRound(intermediate)

      if ((localBust || localFlip7) && ending) {
        // Defer the round-end transition; UI will flush after the player
        // dismisses the bust / flip-7 modal (or the 10s safety timer fires).
        await writeState(intermediate)
        setPendingRoundEnd(true)
      } else {
        const next = round.flushPostDraw(intermediate)
        await writeState(next)
      }
    } catch (err) {
      console.error('useGame: hit failed', err)
      setError(err?.message ?? 'Hit failed')
    } finally {
      setPending(false)
    }
  }, [roomId, gameState, pending, userId, writeState])

  // Commit the deferred round-end. Called by the bust modal's Continue
  // button and by the UI's safety timeout.
  const flushPendingRoundEnd = useCallback(async () => {
    if (!roomId || !gameState || !pendingRoundEnd) return
    setPending(true)
    try {
      const next = round.flushPostDraw(gameState)
      await writeState(next)
      setPendingRoundEnd(false)
    } catch (err) {
      console.error('useGame: flushPendingRoundEnd failed', err)
      setError(err?.message ?? 'Failed to advance round')
    } finally {
      setPending(false)
    }
  }, [roomId, gameState, pendingRoundEnd, writeState])

  // If the round we deferred has *already* been advanced by another client
  // (or we left and rejoined), clear the local pending flag so we don't
  // double-flush on Continue.
  useEffect(() => {
    if (!pendingRoundEnd || !gameState) return
    if (!round.wouldEndRound(gameState)) {
      setPendingRoundEnd(false)
    }
  }, [gameState, pendingRoundEnd])

  const stay = useCallback(() => apply(round.stay), [apply])
  const selectTarget = useCallback(
    (targetId) => apply((s) => round.selectTarget(s, targetId)),
    [apply],
  )
  const cancelPending = useCallback(() => apply(round.cancelPending), [apply])

  return {
    room,
    gameState,
    error,
    pending,
    pendingRoundEnd,
    hit,
    stay,
    selectTarget,
    cancelPending,
    flushPendingRoundEnd,
  }
}

// Helper for the host to seed the initial state when the game starts.
export async function startGame(roomId, membership) {
  const initial = round.initGameState(membership)
  const { error } = await supabase
    .from('rooms')
    .update({ status: 'playing', game_state: initial })
    .eq('id', roomId)
  if (error) throw error
}
