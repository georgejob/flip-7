import { paletteForValue } from './cardColors'

const MINI_W = 18
const MINI_H = 26

const GLOW = '0 0 0 2px rgba(14, 165, 233, 0.45), 0 2px 4px rgba(14, 165, 233, 0.35)'

export const MINI_DIMENSIONS = { width: MINI_W, height: MINI_H, modifierWidth: 22 }

export function MiniCard({ card, glow = false, style }) {
  if (!card) return null
  if (card.type === 'number') return <Num value={card.value} glow={glow} style={style} />
  if (card.type === 'modifier') return <Mod card={card} glow={glow} style={style} />
  if (card.type === 'action') return <Act card={card} glow={glow} style={style} />
  return null
}

function Num({ value, glow, style }) {
  const p = paletteForValue(value)
  const wide = value >= 10
  return (
    <div
      style={{
        width: MINI_W,
        height: MINI_H,
        borderRadius: 4,
        border: `1.5px solid ${p.border}`,
        background: p.bg,
        boxShadow: glow ? GLOW : null,
        color: '#082F49',
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 900,
        fontSize: wide ? 8 : 9,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {value}
    </div>
  )
}

function Mod({ card, glow, style }) {
  const isX2 = card.modifier === 'x2'
  return (
    <div
      style={{
        width: 22,
        height: MINI_H,
        borderRadius: 4,
        border: isX2 ? '1.5px dashed #F59E0B' : '1.5px dashed #FB923C',
        background: isX2 ? '#FCD34D' : '#FED7AA',
        boxShadow: glow ? GLOW : `0 1px 0 ${isX2 ? '#F59E0B' : '#FB923C'}`,
        color: isX2 ? '#78350F' : '#7C2D12',
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 900,
        fontSize: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {isX2 ? '×2' : `+${card.value}`}
    </div>
  )
}

function Act({ card, glow, style }) {
  if (card.action === 'secondChance') {
    return (
      <div
        style={{
          width: 22,
          height: MINI_H,
          borderRadius: 4,
          border: '1.5px solid #6EE7B7',
          background: '#D1FAE5',
          boxShadow: glow ? GLOW : null,
          color: '#064E3B',
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 900,
          fontSize: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
      >
        2nd
      </div>
    )
  }
  return (
    <div
      style={{
        width: 22,
        height: MINI_H,
        borderRadius: 4,
        border: '1.5px solid #818CF8',
        background: '#E0E7FF',
        boxShadow: glow ? GLOW : null,
        color: '#312E81',
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 900,
        fontSize: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {card.action === 'freeze' ? 'frz' : '×3'}
    </div>
  )
}
