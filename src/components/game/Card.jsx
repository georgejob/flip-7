import { paletteForValue } from './cardColors'

const CARD_W = 38
const CARD_H = 54

const GLOW = '0 0 0 3px rgba(14, 165, 233, 0.35), 0 4px 8px rgba(14, 165, 233, 0.25)'

export function Card({ card, glow = false, style }) {
  if (!card) return null
  if (card.type === 'number') return <NumberCard value={card.value} glow={glow} style={style} />
  if (card.type === 'modifier') return <ModifierCard card={card} glow={glow} style={style} />
  if (card.type === 'action') return <ActionCard card={card} glow={glow} style={style} />
  return null
}

export const CARD_DIMENSIONS = { width: CARD_W, height: CARD_H }

function NumberCard({ value, glow, style }) {
  const p = paletteForValue(value)
  const isWide = value >= 10
  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        borderRadius: 7,
        border: `2.5px solid ${p.border}`,
        background: p.bg,
        boxShadow: glow ? GLOW : `0 2px 0 ${p.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        ...style,
      }}
    >
      <div
        style={{
          width: 24,
          height: 32,
          borderRadius: 4,
          border: `2px solid ${p.innerBorder}`,
          background: p.innerBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Fredoka One', cursive",
          fontSize: isWide ? 11 : 14,
          color: '#082F49',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function ModifierCard({ card, glow, style }) {
  const isX2 = card.modifier === 'x2'
  return (
    <div
      style={{
        height: CARD_H,
        minWidth: 44,
        borderRadius: 8,
        border: isX2 ? '2.5px dashed #F59E0B' : '2.5px dashed #FB923C',
        background: isX2
          ? 'linear-gradient(180deg, #FCD34D, #FBBF24)'
          : 'linear-gradient(180deg, #FED7AA, #FDBA74)',
        boxShadow: glow ? GLOW : isX2 ? '0 2px 0 #D97706' : '0 2px 0 #EA580C',
        color: isX2 ? '#78350F' : '#7C2D12',
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 900,
        fontSize: 13,
        padding: '4px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        ...style,
      }}
    >
      {isX2 ? <>⚡ ×2</> : <>+ {card.value}</>}
    </div>
  )
}

function ActionCard({ card, glow, style }) {
  if (card.action === 'secondChance') {
    return (
      <div
        style={{
          height: CARD_H,
          minWidth: 50,
          borderRadius: 8,
          border: '2px dashed #10B981',
          background: 'linear-gradient(180deg, #D1FAE5, #A7F3D0)',
          boxShadow: glow ? GLOW : '0 2px 0 #059669',
          color: '#064E3B',
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 900,
          fontSize: 11,
          padding: '3px 9px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          ...style,
        }}
      >
        🛡 2nd
      </div>
    )
  }
  // freeze / flipThree action cards: rendered with a generic look
  const isFreeze = card.action === 'freeze'
  return (
    <div
      style={{
        height: CARD_H,
        minWidth: 50,
        borderRadius: 8,
        border: '2px dashed #6366F1',
        background: 'linear-gradient(180deg, #E0E7FF, #C7D2FE)',
        boxShadow: glow ? GLOW : '0 2px 0 #4F46E5',
        color: '#312E81',
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 900,
        fontSize: 11,
        padding: '3px 9px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        ...style,
      }}
    >
      {isFreeze ? <>❄ frz</> : <>⚡ ×3</>}
    </div>
  )
}
