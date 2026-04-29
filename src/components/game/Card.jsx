import { paletteForValue } from './cardColors'
import { getCardDetailLevel } from '../../hooks/useAdaptiveLayout'

const CARD_W = 38
const CARD_H = 54

const BLUE_GLOW = '0 0 0 3px rgba(14, 165, 233, 0.35), 0 4px 8px rgba(14, 165, 233, 0.25)'
const RED_GLOW = '0 0 0 3px rgba(239, 68, 68, 0.4), 0 4px 8px rgba(239, 68, 68, 0.25)'

function glowShadow(glow) {
  if (glow === 'red') return RED_GLOW
  if (glow) return BLUE_GLOW
  return null
}

export function Card({ card, glow = false, style, width, height }) {
  if (!card) return null
  if (card.type === 'number') {
    return <NumberCard value={card.value} glow={glow} style={style} width={width} height={height} />
  }
  if (card.type === 'modifier') return <ModifierCard card={card} glow={glow} style={style} />
  if (card.type === 'action') return <ActionCard card={card} glow={glow} style={style} />
  return null
}

export const CARD_DIMENSIONS = { width: CARD_W, height: CARD_H }

function NumberCard({ value, glow, style, width, height }) {
  const p = paletteForValue(value)
  const dynamic = width != null && height != null
  const w = width ?? CARD_W
  const h = height ?? CARD_H
  const detail = dynamic ? getCardDetailLevel(w) : 'full'
  const isWide = value >= 10

  // Scaled typography. Center number is the dominant element on every level.
  const centerFontSize =
    detail === 'full'
      ? Math.max(12, Math.round(h * (isWide ? 0.34 : 0.42)))
      : detail === 'medium'
        ? Math.max(11, Math.round(h * (isWide ? 0.36 : 0.46)))
        : detail === 'compact'
          ? Math.max(11, Math.round(h * (isWide ? 0.42 : 0.52)))
          : Math.max(10, Math.round(h * (isWide ? 0.48 : 0.6)))
  const cornerFontSize = Math.max(7, Math.round(w * 0.22))
  const innerW = Math.round(w * 0.62)
  const innerH = Math.round(h * 0.6)
  const radius = Math.max(4, Math.round(w * 0.18))
  const innerRadius = Math.max(3, Math.round(w * 0.1))

  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        border: `2.5px solid ${p.border}`,
        background: p.bg,
        boxShadow: glowShadow(glow) ?? `0 2px 0 ${p.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        ...style,
      }}
    >
      {(detail === 'full' || detail === 'medium') && (
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: 4,
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: cornerFontSize,
            color: p.innerBorder,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {value}
          {detail === 'full' && (
            <span style={{ fontSize: Math.round(cornerFontSize * 0.85) }}>✦</span>
          )}
        </span>
      )}

      {detail === 'compact' && (
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: 3,
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: cornerFontSize,
            color: p.innerBorder,
            lineHeight: 1,
          }}
        >
          {value}
        </span>
      )}

      {(detail === 'full' || detail === 'medium') ? (
        <div
          style={{
            width: innerW,
            height: innerH,
            borderRadius: innerRadius,
            border: `2px solid ${p.innerBorder}`,
            background: p.innerBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Fredoka One', cursive",
            fontSize: centerFontSize,
            color: '#082F49',
            lineHeight: 1,
          }}
        >
          {value}
        </div>
      ) : (
        <span
          style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: centerFontSize,
            color: '#082F49',
            lineHeight: 1,
          }}
        >
          {value}
        </span>
      )}
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
        boxShadow: glowShadow(glow) ?? (isX2 ? '0 2px 0 #D97706' : '0 2px 0 #EA580C'),
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
          boxShadow: glowShadow(glow) ?? '0 2px 0 #059669',
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
        boxShadow: glowShadow(glow) ?? '0 2px 0 #4F46E5',
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
