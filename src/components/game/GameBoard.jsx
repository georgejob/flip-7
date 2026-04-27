import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../../hooks/useGame'
import { useCurrentUserId } from '../../hooks/useCurrentUserId'
import { PhoneFrame } from '../ui/PhoneFrame'
import { OtherPlayerRow } from './OtherPlayerRow'
import { LeaderboardRow } from './LeaderboardRow'
import { MyHand } from './MyHand'
import { TargetPickerModal } from './TargetPickerModal'
import { BustModal } from './BustModal'
import { SecondChanceModal } from './SecondChanceModal'
import { getCurrentPlayerId, targetableForPending } from '../../game/round'

const STATUS_RANK = { active: 0, stayed: 1, frozen: 2, busted: 3 }
const SHAKE_BEFORE_MODAL_MS = 350

export function GameBoard({ roomId, roomCode, onLeave }) {
  const userId = useCurrentUserId()
  const { gameState, error, pending, hit, stay, selectTarget, cancelPending } = useGame(roomId)
  const [newestCardKey, setNewestCardKey] = useState(null)
  const [bustModal, setBustModal] = useState(null) // { card } | null
  const [saveModal, setSaveModal] = useState(null) // { card } | null
  const [shakeKey, setShakeKey] = useState(0) // bumped to retrigger shake on hand
  const lastEventAtRef = useRef(0)
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
  // last number card in `me.numbers`. Clear after 1.5s.
  useEffect(() => {
    if (!me) return
    if (!gameState?.lastDrawn) return
    if (gameState.lastDrawn.playerId !== userId) return
    const card = gameState.lastDrawn.card
    if (card?.type !== 'number') return
    const i = me.numbers.length - 1
    const key = i >= 0 ? `n-${i}-${me.numbers[i].value}` : null
    if (!key) return
    setNewestCardKey(key)
    const t = setTimeout(() => setNewestCardKey(null), 1500)
    return () => clearTimeout(t)
  }, [gameState?.lastDrawn, me, userId])

  // Bust / save event detection. Each `lastDrawn.at` value represents a single
  // draw event; we track the last one we've reacted to so the same event
  // doesn't trigger the modal twice.
  useEffect(() => {
    const ld = gameState?.lastDrawn
    if (!ld || !userId) return
    if (ld.playerId !== userId) return
    if (ld.at === lastEventAtRef.current) return
    lastEventAtRef.current = ld.at

    if (ld.result === 'busted') {
      // Shake the hand first, then open the modal.
      setShakeKey((k) => k + 1)
      const t = setTimeout(() => setBustModal({ card: ld.card }), SHAKE_BEFORE_MODAL_MS)
      return () => clearTimeout(t)
    }
    if (ld.result === 'saved') {
      setSaveModal({ card: ld.card })
    }
  }, [gameState?.lastDrawn, userId])

  // Clean up modals when a new round starts (engine resets lastDrawn to null).
  useEffect(() => {
    if (!gameState?.lastDrawn) {
      setBustModal(null)
      setSaveModal(null)
    }
  }, [gameState?.lastDrawn])

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

  const turnText = currentPlayerId
    ? isMyTurn
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
        }}
      >
        <button
          type="button"
          onClick={onLeave}
          style={{
            background: 'white',
            border: '2px solid #7DD3FC',
            borderRadius: 10,
            padding: '4px 9px',
            color: '#0284C7',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          ←
        </button>
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
          style={{
            color: '#BAE6FD',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: 11,
          }}
        >
          {deckLeft} left
        </span>
      </div>

      <div
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
        }}
      >
        {leaderboard.map(({ id, player, colorIndex }, i) => (
          <LeaderboardRow key={id} rank={i + 1} player={player} colorIndex={colorIndex} />
        ))}
      </div>

      <MyHand
        player={me}
        bustedSnapshot={me?.status === 'busted' ? prevHandRef.current : null}
        shakeKey={shakeKey}
        round={gameState?.round ?? 1}
        isMyTurn={isMyTurn}
        isWaitingForOther={!isMyTurn}
        waitingForName={currentPlayerName}
        hasPendingAction={!!gameState?.pendingAction}
        newestCardKey={newestCardKey}
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
        onContinue={() => setBustModal(null)}
      />

      <SecondChanceModal
        open={!!saveModal}
        card={saveModal?.card}
        onDismiss={() => setSaveModal(null)}
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
        <button
          type="button"
          onClick={onLeave}
          style={{
            marginTop: 12,
            background: '#0EA5E9',
            border: '3px solid #0369A1',
            boxShadow: '0 4px 0 #0369A1',
            color: 'white',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: 14,
            padding: '10px 20px',
            borderRadius: 12,
            cursor: 'pointer',
          }}
        >
          Back to lobby
        </button>
      </div>
    </div>
  )
}
