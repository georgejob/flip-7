import { MODIFIER_COLORS, modifierTypeFor } from './ModifierCard'

const MINI_W = 22
const MINI_H = 26

const GLOW = '0 0 0 2px rgba(14, 165, 233, 0.45), 0 2px 4px rgba(14, 165, 233, 0.35)'

export function MiniModifierCard({ card, glow = false, style }) {
  const type = modifierTypeFor(card)
  const c = type ? MODIFIER_COLORS[type] : null
  if (!c) return null

  const labelText =
    type === 'x2' ? '×2' : type === 'second' ? '2nd' : type

  return (
    <div
      style={{
        width: MINI_W,
        height: MINI_H,
        borderRadius: 4,
        border: `1.5px solid ${c.border}`,
        background: `linear-gradient(135deg, ${c.miniA}, ${c.miniB})`,
        boxShadow: glow ? GLOW : `0 1px 0 ${c.shadow}`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 900,
          fontSize: 8,
          color: c.tagText,
          lineHeight: 1,
          letterSpacing: '0.02em',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {labelText}
      </span>
      <div
        style={{
          position: 'absolute',
          top: 2,
          right: 2,
          width: 3,
          height: 3,
          borderRadius: '50%',
          background: c.spark,
          boxShadow: `0 0 4px ${c.glow}`,
          zIndex: 1,
        }}
      />
    </div>
  )
}
