import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../../hooks/useGame'
import { useCurrentUserId } from '../../hooks/useCurrentUserId'
import { PhoneFrame } from '../ui/PhoneFrame'
import { OtherPlayerRow } from './OtherPlayerRow'
import { LeaderboardRow } from './LeaderboardRow'
import { MyHand } from './MyHand'
import { TargetPickerModal } from './TargetPickerModal'
import { BustModal } from './BustModal'
import { SecondChanceModal } from './SecondChanceModal'
import { Flip7Modal } from './Flip7Modal'
import { Flip7Toast } from './Flip7Toast'
import { FreezeModal } from './FreezeModal'
import { FreezeToast } from './FreezeToast'
import { Confetti } from './Confetti'
import { PressableButton } from '../ui/PressableButton'
import { useUiMuted } from '../../hooks/useUiSound'
import {
  getCurrentPlayerId,
  targetableForPending,
  wouldEndRound,
} from '../../game/round'

const STATUS_RANK = { active: 0, stayed: 1, frozen: 2, busted: 3 }
const SHAKE_BEFORE_MODAL_MS = 350
const ROUND_END_SAFETY_MS = 10000

export function GameBoard({ roomId, roomCode, onLeave }) {
  const userId = useCurrentUserId()
  const [muted, setMuted] = useUiMuted()
  const {
    gameState,
    error,
    pending,
    pendingRoundEnd,
    hit,
    stay,
    selectTarget,
    cancelPending,
    flushPendingRoundEnd,
  } = useGame(roomId, userId)
  const [newestCardKey, setNewestCardKey] = useState(null)
  const [animatedDrawAt, setAnimatedDrawAt] = useState(0) // last lastDrawn.at whose flying-card animation has landed
  const [bustModal, setBustModal] = useState(null) // { card } | null
  const [saveModal, setSaveModal] = useState(null) // { card } | null
  const [flip7Modal, setFlip7Modal] = useState(null) // { card } | null — local player's flip-7
  const [flip7Toast, setFlip7Toast] = useState(null) // { name } | null — other player's flip-7
  const [freezeModal, setFreezeModal] = useState(null) // { fromName, isSelfFreeze, pointsBanked, endsRound } | null
  const [freezeToast, setFreezeToast] = useState(null) // { name } | null — toast for freezer
  const [freezeFlash, setFreezeFlash] = useState(0) // bumps to trigger blue glow on hand
  const [frozenHandSnapshot, setFrozenHandSnapshot] = useState(null) // hand at moment of freeze
  const [confettiActive, setConfettiActive] = useState(false)
  const [shakeKey, setShakeKey] = useState(0) // bumped to retrigger shake on hand
  const [pinnedBustCard, setPinnedBustCard] = useState(null) // dup card for our bust, kept after lastDrawn moves on
  const [pinnedFlip7Card, setPinnedFlip7Card] = useState(null) // 7th card for our flip-7, kept after lastDrawn moves on
  const lastEventAtRef = useRef(0)
  const lastOtherFlip7AtRef = useRef(0)
  const lastFreezerToastAtRef = useRef(0) // last lastFreeze.at processed for the freezer toast
  const freezeModalSeenRef = useRef(0) // set to lastFreeze.at when modal has fired; prevents re-fire
  const bustModalTimerRef = useRef(null) // pending setTimeout id for the shake→modal transition
  const prevHandRef = useRef(null) // most-recent active-hand snapshot for the local player

  const currentPlayerId = gameState ? getCurrentPlayerId(gameState) : null
  const isMyTurn = !!userId && currentPlayerId === userId
  const me = userId ? gameState?.players?.[userId] : null
  const currentPlayerName = currentPlayerId ? gameState.players[currentPlayerId]?.name : null

  // Snapshot the local player's hand whenever they're active. When they bust,
  // the engine clears their hand — we keep showing this snapshot for the rest
  // of the round. Round reset returns them to active with empty arrays, which
  // overwrites the snapshot cleanly.
  useEffect(() => {
    if (!me) return
    if (me.status === 'active') {
      prevHandRef.current = {
        numbers: me.numbers,
        modifiers: me.modifiers,
        secondChance: me.secondChance,
      }
    }
  }, [me])

  // Newest-card glow tracking for the local player's hand. The newest is the
  // last number card in `me.numbers`. Clear after 1.5s. Gated on the
  // flying-card animation having landed so the glow is visible on the real
  // card rather than wasted while the card is in flight.
  useEffect(() => {
    if (!me) return
    if (!gameState?.lastDrawn) return
    if (gameState.lastDrawn.playerId !== userId) return
    if (gameState.lastDrawn.at > animatedDrawAt) return
    const card = gameState.lastDrawn.card
    if (card?.type !== 'number') return
    const i = me.numbers.length - 1
    const key = i >= 0 ? `n-${i}-${me.numbers[i].value}` : null
    if (!key) return
    setNewestCardKey(key)
    const t = setTimeout(() => setNewestCardKey(null), 1500)
    return () => clearTimeout(t)
  }, [gameState?.lastDrawn, me, userId, animatedDrawAt])

  // Bust / save event detection. Each `lastDrawn.at` value represents a single
  // draw event; we track the last one we've reacted to so the same event
  // doesn't trigger the modal twice.
  //
  // The shake→modal timer lives in a ref (not the effect's cleanup) because
  // gameState updates land twice — once optimistically, once via Supabase
  // realtime echo — and any state change re-runs this effect. A cleanup-based
  // clearTimeout would race the echo and cancel the modal before it opens.
  useEffect(() => {
    const ld = gameState?.lastDrawn
    if (!ld || !userId) return
    if (ld.playerId !== userId) return
    if (ld.at === lastEventAtRef.current) return
    if (ld.at > animatedDrawAt) return // wait for the flying-card animation to land
    lastEventAtRef.current = ld.at

    if (ld.result === 'busted') {
      setShakeKey((k) => k + 1)
      if (bustModalTimerRef.current) clearTimeout(bustModalTimerRef.current)
      bustModalTimerRef.current = setTimeout(() => {
        bustModalTimerRef.current = null
        setBustModal({ card: ld.card })
      }, SHAKE_BEFORE_MODAL_MS)
    } else if (ld.result === 'saved') {
      setSaveModal({ card: ld.card })
    } else if (ld.result === 'flip7') {
      setPinnedFlip7Card(ld.card)
      setConfettiActive(true)
      setFlip7Modal({ card: ld.card })
    }
  }, [gameState?.lastDrawn, userId, animatedDrawAt])

  // Other-player flip-7 detection — fires the toast on non-local clients.
  useEffect(() => {
    const ld = gameState?.lastDrawn
    if (!ld || !userId) return
    if (ld.playerId === userId) return
    if (ld.result !== 'flip7') return
    if (ld.at === lastOtherFlip7AtRef.current) return
    lastOtherFlip7AtRef.current = ld.at
    const name = gameState?.players?.[ld.playerId]?.name ?? 'Player'
    setFlip7Toast({ name })
  }, [gameState?.lastDrawn, userId, gameState?.players])

  // Clear any pending shake→modal timer on unmount.
  useEffect(
    () => () => {
      if (bustModalTimerRef.current) clearTimeout(bustModalTimerRef.current)
    },
    [],
  )

  // Clean up modals when a new round starts (engine resets lastDrawn to null).
  useEffect(() => {
    if (!gameState?.lastDrawn) {
      setBustModal(null)
      setSaveModal(null)
      setFlip7Modal(null)
      setPinnedFlip7Card(null)
      setConfettiActive(false)
    }
  }, [gameState?.lastDrawn])

  // Freeze event detection for the local player (target). Fires the freeze
  // modal once per freeze event. Each lastFreeze.at uniquely identifies one
  // event so a re-render or echoed Supabase update can't fire it twice.
  useEffect(() => {
    const lf = gameState?.lastFreeze
    if (!lf || !userId) return
    if (lf.targetId !== userId) return
    if (lf.at === freezeModalSeenRef.current) return
    freezeModalSeenRef.current = lf.at
    const isSelfFreeze = lf.fromPlayerId === userId
    const fromName = isSelfFreeze
      ? null
      : (gameState.players?.[lf.fromPlayerId]?.name ?? 'Someone')
    // Snapshot the hand we want to keep showing while frozen — the engine
    // has already cleared it on the player object, so we capture the
    // pre-freeze snapshot we've been tracking for the local player.
    if (prevHandRef.current) {
      setFrozenHandSnapshot({
        numbers: prevHandRef.current.numbers ?? [],
        modifiers: prevHandRef.current.modifiers ?? [],
        secondChance: prevHandRef.current.secondChance ?? null,
      })
    } else {
      setFrozenHandSnapshot({ numbers: [], modifiers: [], secondChance: null })
    }
    setFreezeFlash((k) => k + 1)
    // Only self-freezes can end the round (a freeze by another player leaves
    // them still active). The deferred state still satisfies wouldEndRound
    // because flushPostDraw hasn't run yet — pendingAction is null and
    // activePlayers is empty.
    const ending = isSelfFreeze && wouldEndRound(gameState)
    setFreezeModal({
      fromName,
      isSelfFreeze,
      pointsBanked: lf.pointsBanked ?? 0,
      endsRound: ending,
    })
  }, [gameState, gameState?.lastFreeze, userId])

  // Toast for the player who applied the freeze (when target ≠ self).
  useEffect(() => {
    const lf = gameState?.lastFreeze
    if (!lf || !userId) return
    if (lf.fromPlayerId !== userId) return
    if (lf.targetId === userId) return
    if (lf.at === lastFreezerToastAtRef.current) return
    lastFreezerToastAtRef.current = lf.at
    const name = gameState.players?.[lf.targetId]?.name ?? 'Player'
    setFreezeToast({ name })
  }, [gameState?.lastFreeze, gameState?.players, userId])

  // Reset frozen state on a new round (engine resets lastFreeze to null).
  useEffect(() => {
    if (!gameState?.lastFreeze) {
      setFrozenHandSnapshot(null)
      // Don't reset modal here — the modal closes via its own onContinue and
      // we want it to survive the lastFreeze field being cleared by round
      // reset (e.g. self-freeze flush sets lastFreeze:null while modal still
      // open). The modal's own state controls visibility.
    }
  }, [gameState?.lastFreeze])

  // Safety timeout: if the local player busted / flipped-7 / self-froze as
  // last-active and never dismisses the modal, auto-flush the deferred
  // round-end so other clients don't wait forever.
  useEffect(() => {
    if (!pendingRoundEnd) return
    if (!bustModal && !flip7Modal && !freezeModal) return
    const t = setTimeout(() => {
      setBustModal(null)
      setFlip7Modal(null)
      setFreezeModal(null)
      setConfettiActive(false)
      flushPendingRoundEnd()
    }, ROUND_END_SAFETY_MS)
    return () => clearTimeout(t)
  }, [bustModal, flip7Modal, freezeModal, pendingRoundEnd, flushPendingRoundEnd])

  const handleBustContinue = useCallback(() => {
    setBustModal(null)
    if (pendingRoundEnd) {
      // Fire-and-forget; the local state update arrives via the realtime
      // subscription. Errors surface through useGame's `error`.
      flushPendingRoundEnd()
    }
  }, [pendingRoundEnd, flushPendingRoundEnd])

  const handleFlip7Continue = useCallback(() => {
    setFlip7Modal(null)
    setConfettiActive(false)
    if (pendingRoundEnd) {
      flushPendingRoundEnd()
    }
  }, [pendingRoundEnd, flushPendingRoundEnd])

  const handleFreezeContinue = useCallback(() => {
    setFreezeModal(null)
    if (pendingRoundEnd) {
      flushPendingRoundEnd()
    }
  }, [pendingRoundEnd, flushPendingRoundEnd])

  // Pin the bust card once we see the local player's bust event. lastDrawn
  // is overwritten by every subsequent draw (other players' turns), so we
  // can't read it directly for the rest of the round. Reset on round flip.
  useEffect(() => {
    if (me?.status !== 'busted') {
      if (pinnedBustCard !== null) setPinnedBustCard(null)
      return
    }
    if (pinnedBustCard !== null) return
    const ld = gameState?.lastDrawn
    if (ld?.playerId === userId && ld?.result === 'busted') {
      setPinnedBustCard(ld.card)
    }
  }, [me?.status, gameState?.lastDrawn, userId, pinnedBustCard])

  // Build the displayed hand for the local-player flip-7 state. The engine
  // clears the hand on flip-7 (cards go to discard at round end), so we
  // splice the 7th card onto the prev-hand snapshot to keep showing all 7.
  const flip7DisplayHand = useMemo(() => {
    if (!flip7Modal || !prevHandRef.current) return null
    const ld = gameState?.lastDrawn
    const isOurFlip7 = ld?.playerId === userId && ld?.result === 'flip7'
    const seventh = pinnedFlip7Card ?? (isOurFlip7 ? ld.card : null)
    const base = prevHandRef.current.numbers ?? []
    const numbers = seventh?.type === 'number' ? [...base, seventh] : base
    return {
      numbers,
      modifiers: prevHandRef.current.modifiers ?? [],
      secondChance: prevHandRef.current.secondChance ?? null,
      bustingIndex: -1,
    }
  }, [flip7Modal, pinnedFlip7Card, gameState?.lastDrawn, userId])

  // Build the displayed hand for the busted state: pre-bust hand snapshot +
  // the duplicate card that caused the bust, so the player can see the card
  // sitting in their hand. The duplicate gets a persistent red glow.
  const bustingDisplayHand = useMemo(() => {
    if (me?.status !== 'busted' || !prevHandRef.current) return null
    // Prefer the pinned card; fall back to lastDrawn on the very first render
    // after bust (before the effect above stores it) so there's no flicker.
    const ld = gameState?.lastDrawn
    const isOurBust = ld?.playerId === userId && ld?.result === 'busted'
    const dup = pinnedBustCard ?? (isOurBust ? ld.card : null)
    const base = prevHandRef.current.numbers ?? []
    const numbers = dup?.type === 'number' ? [...base, dup] : base
    return {
      numbers,
      modifiers: prevHandRef.current.modifiers ?? [],
      secondChance: prevHandRef.current.secondChance ?? null,
      bustingIndex: dup?.type === 'number' ? base.length : -1,
    }
  }, [me?.status, pinnedBustCard, gameState?.lastDrawn, userId])

  const sortedOthers = useMemo(() => {
    if (!gameState) return []
    const order = gameState.playerOrder
    const others = order
      .filter((id) => id !== userId)
      .map((id) => ({ id, player: gameState.players[id], colorIndex: order.indexOf(id) }))

    return others.sort((a, b) => {
      const aTurn = a.id === currentPlayerId ? -1 : 0
      const bTurn = b.id === currentPlayerId ? -1 : 0
      if (aTurn !== bTurn) return aTurn - bTurn
      return STATUS_RANK[a.player.status] - STATUS_RANK[b.player.status]
    })
  }, [gameState, userId, currentPlayerId])

  const leaderboard = useMemo(() => {
    if (!gameState) return []
    return gameState.playerOrder
      .map((id, i) => ({ id, player: gameState.players[id], colorIndex: i }))
      .sort((a, b) => {
        if (b.player.totalScore !== a.player.totalScore) {
          return b.player.totalScore - a.player.totalScore
        }
        return a.player.name.localeCompare(b.player.name)
      })
  }, [gameState])

  const deckLeft = gameState?.deck?.length ?? 0

  const pendingForMe =
    gameState?.pendingAction && gameState.pendingAction.fromPlayerId === userId
      ? gameState.pendingAction
      : null
  const targets = pendingForMe ? targetableForPending(gameState) : []

  const phase = gameState?.phase ?? 'play'
  const turnText = currentPlayerId
    ? phase === 'initialDeal'
      ? isMyTurn
        ? 'dealing your card…'
        : `dealing to ${currentPlayerName}…`
      : isMyTurn
        ? 'your turn'
        : `${currentPlayerName}'s turn`
    : ''

  return (
    <PhoneFrame>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          gap: 8,
          flexShrink: 0,
        }}
      >
        <PressableButton
          onClick={onLeave}
          shadowDepth={2}
          shadowColor="#7DD3FC"
          pressScale={0.97}
          soundProfile="small"
          aria-label="Leave game"
          style={{
            background: 'white',
            border: '2px solid #7DD3FC',
            borderRadius: 10,
            padding: '4px 9px',
            color: '#0284C7',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: 11,
          }}
        >
          ←
        </PressableButton>
        <span
          style={{
            background: '#38BDF8',
            border: '2px solid #0EA5E9',
            color: '#082F49',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            borderRadius: 20,
            padding: '4px 10px',
          }}
        >
          ✦ round {gameState?.round ?? 1}
        </span>
        <span
          style={{
            color: isMyTurn ? '#0284C7' : '#A78BFA',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            flex: 1,
            textAlign: 'center',
          }}
        >
          {turnText}
        </span>
        <span
          data-deck-count="true"
          style={{
            color: '#BAE6FD',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: 11,
          }}
        >
          {deckLeft} cards left
        </span>
        <PressableButton
          onClick={() => setMuted(!muted)}
          shadowDepth={2}
          shadowColor="#7DD3FC"
          pressScale={0.95}
          soundProfile={muted ? 'none' : 'small'}
          aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
          aria-pressed={muted}
          style={{
            background: 'white',
            border: '2px solid #7DD3FC',
            borderRadius: 10,
            padding: '4px 8px',
            color: '#0284C7',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: 12,
            lineHeight: 1,
          }}
        >
          {muted ? '🔇' : '🔊'}
        </PressableButton>
      </div>

      <div
        className="others-scroll"
        style={{
          background: 'rgba(255,255,255,0.5)',
          border: '2px solid #BAE6FD',
          borderRadius: 12,
          height: 168,
          marginBottom: 8,
          padding: 6,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          scrollbarWidth: 'thin',
          scrollbarColor: '#7DD3FC transparent',
          flexShrink: 0,
        }}
      >
        {sortedOthers.length === 0 && (
          <div
            style={{
              color: '#7DD3FC',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: 11,
              textAlign: 'center',
              padding: 20,
            }}
          >
            No other players
          </div>
        )}
        {sortedOthers.map(({ id, player, colorIndex }) => (
          <OtherPlayerRow
            key={id}
            player={player}
            colorIndex={colorIndex}
            isCurrentTurn={id === currentPlayerId}
          />
        ))}
      </div>

      <div
        className="progress-section"
        style={{
          background: 'white',
          border: '2px solid #7DD3FC',
          borderRadius: 12,
          height: 110,
          marginBottom: 8,
          padding: 8,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#7DD3FC transparent',
          flexShrink: 0,
        }}
      >
        {leaderboard.map(({ id, player, colorIndex }, i) => (
          <LeaderboardRow key={id} rank={i + 1} player={player} colorIndex={colorIndex} />
        ))}
      </div>

      <MyHand
        player={me}
        bustedSnapshot={bustingDisplayHand}
        flip7Snapshot={flip7DisplayHand}
        frozenSnapshot={frozenHandSnapshot}
        freezeFlashKey={freezeFlash}
        shakeKey={shakeKey}
        round={gameState?.round ?? 1}
        phase={phase}
        isMyTurn={isMyTurn}
        isWaitingForOther={!isMyTurn}
        waitingForName={currentPlayerName}
        hasPendingAction={!!gameState?.pendingAction}
        newestCardKey={newestCardKey}
        localDrawAt={
          gameState?.lastDrawn?.playerId === userId ? gameState.lastDrawn.at : 0
        }
        localDrawnCard={
          gameState?.lastDrawn?.playerId === userId ? gameState.lastDrawn.card : null
        }
        onDrawAnimated={setAnimatedDrawAt}
        onHit={hit}
        onStay={stay}
        pending={pending}
      />

      {error && (
        <div
          style={{
            marginTop: 8,
            background: '#FEF2F2',
            border: '2px solid #FCA5A5',
            color: '#7F1D1D',
            borderRadius: 10,
            padding: 8,
            fontWeight: 800,
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      {gameState?.status === 'finished' && (
        <FinishedOverlay winnerName={gameState.players[gameState.winner]?.name} onLeave={onLeave} />
      )}

      {pendingForMe && (
        <TargetPickerModal
          action={pendingForMe}
          targets={targets.map((id) => ({ id, name: gameState.players[id].name }))}
          onPick={selectTarget}
          onCancel={cancelPending}
        />
      )}

      <BustModal
        open={!!bustModal}
        card={bustModal?.card}
        onContinue={handleBustContinue}
      />

      <SecondChanceModal
        open={!!saveModal}
        card={saveModal?.card}
        onDismiss={() => setSaveModal(null)}
      />

      <Confetti active={confettiActive} count={100} duration={3000} />

      <Flip7Modal
        open={!!flip7Modal}
        numbers={flip7DisplayHand?.numbers ?? []}
        modifiers={flip7DisplayHand?.modifiers ?? []}
        onContinue={handleFlip7Continue}
      />

      <Flip7Toast
        open={!!flip7Toast}
        name={flip7Toast?.name}
        onDismiss={() => setFlip7Toast(null)}
      />

      <FreezeModal
        open={!!freezeModal}
        fromName={freezeModal?.fromName}
        isSelfFreeze={!!freezeModal?.isSelfFreeze}
        pointsBanked={freezeModal?.pointsBanked ?? 0}
        endsRound={!!freezeModal?.endsRound}
        onContinue={handleFreezeContinue}
      />

      <FreezeToast
        open={!!freezeToast}
        name={freezeToast?.name}
        onDismiss={() => setFreezeToast(null)}
      />
    </PhoneFrame>
  )
}

function FinishedOverlay({ winnerName, onLeave }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(8, 47, 73, 0.85)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 'inherit',
      }}
    >
      <div
        style={{
          background: 'white',
          border: '4px solid #FCD34D',
          borderRadius: 20,
          padding: 24,
          textAlign: 'center',
          maxWidth: 280,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
        <h2
          style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 24,
            color: '#082F49',
            margin: '0 0 8px',
          }}
        >
          {winnerName ?? 'Someone'} wins!
        </h2>
        <PressableButton
          onClick={onLeave}
          shadowDepth={4}
          shadowColor="#0369A1"
          pressScale={0.96}
          ripple
          rippleColor="rgba(255,255,255,0.25)"
          releaseFlash={{ color: 'rgba(252, 211, 77, 0.45)', durationMs: 150 }}
          soundProfile="primary"
          style={{
            marginTop: 12,
            background: '#0EA5E9',
            border: '3px solid #0369A1',
            color: 'white',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: 14,
            padding: '10px 20px',
            borderRadius: 12,
          }}
        >
          Back to lobby
        </PressableButton>
      </div>
    </div>
  )
}
