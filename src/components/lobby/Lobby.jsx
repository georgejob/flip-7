import { useState } from 'react'
import { createRoom, joinRoom } from '../../game/supabase'
import { PhoneFrame } from '../ui/PhoneFrame'
import { Logo } from '../ui/Logo'
import { CardFan } from './CardFan'

const inputBase = {
  background: 'white',
  border: '2.5px solid #7DD3FC',
  borderRadius: 14,
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  color: '#082F49',
  fontSize: 16,
  padding: '14px 16px',
  width: '100%',
  display: 'block',
}

const labelStyle = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: '#0284C7',
  marginBottom: 8,
  display: 'block',
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

const secondaryButton = {
  background: '#38BDF8',
  border: '3px solid #0284C7',
  boxShadow: '0 5px 0 #0284C7',
  color: '#082F49',
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  fontSize: 18,
  padding: '14px',
  borderRadius: 14,
  width: '100%',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const disabledStyle = {
  background: '#E0F2FE',
  border: '3px solid #BAE6FD',
  boxShadow: '0 5px 0 #BAE6FD',
  color: '#7DD3FC',
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

export function Lobby({ onEnterRoom }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const trimmedName = name.trim()
  const canCreate = trimmedName.length > 0 && !busy
  const canJoin = trimmedName.length > 0 && code.trim().length === 4 && !busy

  async function handleCreate() {
    if (!canCreate) return
    setBusy(true)
    setError(null)
    try {
      const { roomId, code } = await createRoom(trimmedName)
      onEnterRoom({ roomId, code, playerName: trimmedName, isHost: true })
    } catch (err) {
      console.error(err)
      setError(err.message ?? 'Could not create room')
    } finally {
      setBusy(false)
    }
  }

  async function handleJoin() {
    if (!canJoin) return
    setBusy(true)
    setError(null)
    try {
      const upper = code.trim().toUpperCase()
      const { roomId } = await joinRoom(upper, trimmedName)
      onEnterRoom({ roomId, code: upper, playerName: trimmedName, isHost: false })
    } catch (err) {
      console.error(err)
      setError(err.message ?? 'Could not join room')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PhoneFrame>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <Logo />
        <p
          style={{
            margin: '10px 0 0',
            fontWeight: 800,
            color: '#0369A1',
            fontSize: 14,
          }}
        >
          Push your luck. First to 200 wins!
        </p>
      </div>

      <CardFan />

      <div
        style={{
          background: 'white',
          border: '2.5px solid #7DD3FC',
          borderRadius: 16,
          padding: 18,
          marginTop: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div>
          <label style={labelStyle} htmlFor="player-name">Your name</label>
          <input
            id="player-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            placeholder="enter your name"
            style={inputBase}
            maxLength={20}
          />
        </div>

        <button
          type="button"
          style={{
            ...primaryButton,
            ...(canCreate ? null : disabledStyle),
          }}
          onClick={handleCreate}
          disabled={!canCreate}
        >
          Create room →
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#7DD3FC',
            fontWeight: 900,
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          <span style={{ flex: 1, height: 2, background: '#BAE6FD', borderRadius: 2 }} />
          <span style={{ color: '#0284C7' }}>or join</span>
          <span style={{ flex: 1, height: 2, background: '#BAE6FD', borderRadius: 2 }} />
        </div>

        <div>
          <label style={labelStyle} htmlFor="room-code">Room code</label>
          <input
            id="room-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
            placeholder="ABCD"
            style={{
              ...inputBase,
              fontSize: 22,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
            maxLength={4}
          />
        </div>

        <button
          type="button"
          style={{
            ...secondaryButton,
            ...(canJoin ? null : disabledStyle),
          }}
          onClick={handleJoin}
          disabled={!canJoin}
        >
          Join →
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: 14,
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

      <div style={{ flex: 1 }} />

    </PhoneFrame>
  )
}
