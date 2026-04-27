import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getGameState, subscribeToRoom, updateGameState } from '../game/supabase'
import * as round from '../game/round'

// Subscribes to a room's game_state and returns the current state plus
// action callbacks. Each action computes the new state locally (pure round
// functions) and writes it back via updateGameState — Supabase Realtime
// echoes the change to every other client.
export function useGame(roomId) {
  const [gameState, setGameState] = useState(null)
  const [room, setRoom] = useState(null)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)

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

  // Wraps a state-mutator from round.js. Reads the latest game_state from
  // a callback to avoid races.
  const apply = useCallback(
    async (mutator) => {
      if (!roomId || pending) return
      setPending(true)
      setError(null)
      try {
        const next = mutator(gameState)
        if (!next || next === gameState) return
        const status = next.status === 'finished' ? 'finished' : 'playing'
        await updateGameState(roomId, next, { status })
        setGameState(next)
      } catch (err) {
        console.error('useGame: action failed', err)
        setError(err?.message ?? 'Action failed')
      } finally {
        setPending(false)
      }
    },
    [roomId, gameState, pending],
  )

  const hit = useCallback(() => apply(round.hit), [apply])
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
    hit,
    stay,
    selectTarget,
    cancelPending,
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
