import { PhoneFrame } from '../ui/PhoneFrame'
import { Logo } from '../ui/Logo'

const labelStyle = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: '#0284C7',
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

export function GameScreen({ roomCode, onLeave }) {
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
        <span style={badgeStyle}>Playing</span>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Logo size={42} />
      </div>

      <div
        style={{
          background: 'white',
          border: '2.5px solid #7DD3FC',
          borderRadius: 16,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ ...labelStyle, marginBottom: 12 }}>Game in progress</div>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎴</div>
        <p style={{ color: '#082F49', fontWeight: 800, fontSize: 14, lineHeight: 1.5, margin: 0 }}>
          Game screen coming soon.
        </p>
        {roomCode && (
          <p style={{ color: '#7DD3FC', fontWeight: 900, fontSize: 12, marginTop: 12, letterSpacing: '0.2em' }}>
            ROOM {roomCode}
          </p>
        )}
      </div>
    </PhoneFrame>
  )
}
