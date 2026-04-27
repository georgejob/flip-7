import { useEffect, useMemo, useState } from 'react'
import { useRoomSession } from '../../hooks/useRoomSession'
import { supabase } from '../../lib/supabase'
import { PhoneFrame } from '../ui/PhoneFrame'
import { Logo } from '../ui/Logo'

const TIPS = [
  "Flip 7 unique number cards and score an automatic 15 bonus points!",
  "The more valuable a card is, the more copies exist in the deck. Watch out for 12s!",
  "A Freeze card banks a player's points immediately — use it wisely.",
  "Second Chance saves you from one duplicate — but it's discarded at the end of the round even if unused.",
  "Modifier cards don't count toward your 7-card bonus. Only number cards do!",
  "The x2 modifier doubles your number card total first — then flat bonuses are added on top.",
  "There's one Zero card in the deck. It's worth no points but helps you chase the Flip 7 bonus!",
  "Flip Three forces another player to draw 3 cards one at a time — risky but exciting.",
]

const DOT_COLORS = ['#0EA5E9', '#A78BFA', '#F472B6', '#A5B4FC', '#A7F3D0', '#FCD34D']
const MAX_PLAYERS = 18

const labelStyle = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: '#0284C7',
}

const cardPanel = {
  background: 'white',
  border: '2.5px solid #7DD3FC',
  borderRadius: 16,
  padding: 18,
}

const primaryButton = {
  background: '#0EA5E9',
  border: '3px solid #0369A1',
  boxShadow: '0 5px 0 #0369A1',
  color: 'white',
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  fontSize: 18,
  padding: '14px',
  borderRadius: 14,
  width: '100%',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const disabledButton = {
  background: '#E0F2FE',
  border: '3px solid #BAE6FD',
  boxShadow: '0 5px 0 #BAE6FD',
  color: '#7DD3FC',
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  fontSize: 18,
  padding: '14px',
  borderRadius: 14,
  width: '100%',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  cursor: 'default',
}

const badgeStyle = {
  display: 'inline-block',
  background: '#38BDF8',
  border: '2px solid #0EA5E9',
  color: '#082F49',
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  borderRadius: 20,
  padding: '6px 14px',
}

export function WaitingRoom({ roomId, roomCode, isHost, onLeave, onStart }) {
  const { room, players, loading, error: sessionError } = useRoomSession(roomId)
  const [copied, setCopied] = useState(false)
  const [starting, setStarting] = useState(false)
  const [actionError, setActionError] = useState(null)
  const error = actionError ?? sessionError

  const tip = useMemo(() => TIPS[Math.floor(Math.random() * TIPS.length)], [])

  const status = room?.status

  useEffect(() => {
    if (status === 'playing') {
      onStart()
    }
  }, [status, onStart])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setActionError('Copy failed — select the code manually')
    }
  }

  async function handleStart() {
    if (!isHost || starting) return
    setStarting(true)
    setActionError(null)
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ status: 'playing' })
        .eq('id', roomId)
      if (error) throw error
    } catch (err) {
      console.error(err)
      setActionError(err.message ?? 'Could not start game')
      setStarting(false)
    }
  }

  return (
    <PhoneFrame>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button
          type="button"
          onClick={onLeave}
          style={{
            background: 'white',
            border: '2px solid #7DD3FC',
            borderRadius: 12,
            padding: '6px 12px',
            color: '#0284C7',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          ← Leave
        </button>
        <span style={badgeStyle}>{loading ? 'Connecting…' : 'Lobby'}</span>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <Logo size={42} />
      </div>

      <div style={{ ...cardPanel, marginBottom: 14, textAlign: 'center' }}>
        <div style={{ ...labelStyle, marginBottom: 8 }}>Room code</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: 44,
              letterSpacing: '0.2em',
              color: '#082F49',
              textShadow: '2px 2px 0px #BAE6FD',
            }}
          >
            {roomCode}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              background: copied ? '#A7F3D0' : '#BAE6FD',
              border: `2px solid ${copied ? '#6EE7B7' : '#38BDF8'}`,
              boxShadow: `0 3px 0 ${copied ? '#6EE7B7' : '#38BDF8'}`,
              borderRadius: 10,
              padding: '8px 10px',
              color: '#082F49',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: 'pointer',
            }}
            aria-label="Copy room code"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 12, fontWeight: 800, color: '#0369A1' }}>
          Share this code with friends
        </p>
      </div>

      <div style={{ ...cardPanel, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={labelStyle}>Players</span>
          <span
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: 14,
              color: '#082F49',
              background: '#E0F2FE',
              padding: '4px 10px',
              borderRadius: 10,
            }}
          >
            {players.length} / {MAX_PLAYERS}
          </span>
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {players.length === 0 && (
            <li style={{ color: '#7DD3FC', fontSize: 13, fontWeight: 800, textAlign: 'center', padding: 8 }}>
              Waiting for players to join…
            </li>
          )}
          {players.map((p, i) => (
            <PlayerRow
              key={p.id}
              name={p.name}
              colorIndex={i}
              isHost={room && p.user_id === room.host_id}
            />
          ))}
        </ul>
      </div>

      <div
        style={{
          background: 'white',
          border: '2.5px solid #C4B5FD',
          borderRadius: 16,
          padding: 14,
          marginBottom: 14,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: 36,
            height: 36,
            borderRadius: 10,
            background: '#DDD6FE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}
          aria-hidden
        >
          💡
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#7C3AED',
              marginBottom: 4,
            }}
          >
            Did you know?
          </div>
          <div style={{ color: '#4C1D95', fontSize: 13, fontWeight: 800, lineHeight: 1.4 }}>
            {tip}
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {error && (
        <div
          style={{
            marginBottom: 12,
            background: '#FEF2F2',
            border: '2px solid #FCA5A5',
            color: '#7F1D1D',
            borderRadius: 12,
            padding: 10,
            fontWeight: 800,
            fontSize: 13,
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      {isHost ? (
        <button
          type="button"
          onClick={handleStart}
          disabled={starting || players.length < 1}
          style={starting || players.length < 1 ? disabledButton : primaryButton}
        >
          {starting ? 'Starting…' : 'Start game →'}
        </button>
      ) : (
        <button type="button" disabled style={disabledButton}>
          Waiting for host…
        </button>
      )}
    </PhoneFrame>
  )
}

function PlayerRow({ name, colorIndex, isHost }) {
  const color = DOT_COLORS[colorIndex % DOT_COLORS.length]
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        background: '#F0F9FF',
        borderRadius: 12,
        border: '2px solid #E0F2FE',
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
          boxShadow: '0 2px 0 rgba(2,132,199,0.18)',
        }}
        aria-hidden
      />
      <span
        style={{
          flex: 1,
          color: '#082F49',
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 900,
          fontSize: 14,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </span>
      {isHost && (
        <span
          style={{
            background: '#FCD34D',
            border: '1.5px solid #F59E0B',
            color: '#78350F',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            borderRadius: 8,
            padding: '3px 8px',
          }}
        >
          Host
        </span>
      )}
    </li>
  )
}
