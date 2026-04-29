import { cardColorsFor } from './cardColors'
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
  const c = cardColorsFor(value)
  const dynamic = width != null && height != null
  const w = width ?? CARD_W
  const h = height ?? CARD_H
  const detail = dynamic ? getCardDetailLevel(w) : 'full'
  const isWide = value >= 10

  const centerFontSize =
    detail === 'full'
      ? Math.max(12, Math.round(h * (isWide ? 0.34 : 0.42)))
      : detail === 'medium'
        ? Math.max(11, Math.round(h * (isWide ? 0.36 : 0.46)))
        : detail === 'compact'
          ? Math.max(11, Math.round(h * (isWide ? 0.42 : 0.52)))
          : Math.max(10, Math.round(h * (isWide ? 0.48 : 0.6)))

  // Pip dimensions track card width so they don't overflow at compact/minimal
  // sizes. The 14px / 24px / 6px values in the spec are the full-size design.
  const pipFontSize = Math.min(14, Math.max(8, Math.round(w * 0.22)))
  const pipPadV = Math.max(1, Math.round(pipFontSize * 0.18))
  const pipPadH = Math.max(3, Math.round(pipFontSize * 0.45))
  const pipMinWidth = Math.max(14, Math.round(pipFontSize * 1.7))
  const pipRadius = Math.max(3, Math.round(pipFontSize * 0.45))
  const pipBorderWidth = w >= 44 ? 1.5 : 1
  const pipOffset = Math.max(3, Math.round(w * 0.1))

  const baseShadow = '0 4px 0 var(--shadow), 0 6px 18px rgba(0,0,0,0.10)'

  const showBottomPip = detail === 'full'
  const showSuit = detail === 'full' || detail === 'medium'

  const cssVars = {
    '--wash1': c.wash1,
    '--wash2': c.wash2,
    '--border': c.border,
    '--shadow': c.shadow,
    '--text': c.text,
  }

  const pipStyle = {
    position: 'absolute',
    background: 'rgba(255,255,255,0.92)',
    border: `${pipBorderWidth}px solid var(--border)`,
    borderRadius: pipRadius,
    padding: `${pipPadV}px ${pipPadH}px`,
    fontFamily: "'Nunito', sans-serif",
    fontSize: pipFontSize,
    fontWeight: 900,
    color: 'var(--text)',
    lineHeight: 1,
    minWidth: pipMinWidth,
    textAlign: 'center',
    boxShadow: '0 1px 4px rgba(0,0,0,0.14)',
    zIndex: 4,
  }

  return (
    <div
      style={{
        ...cssVars,
        width: w,
        height: h,
        borderRadius: 14,
        border: '2.5px solid var(--border)',
        background: '#fff',
        boxShadow: glowShadow(glow) ?? baseShadow,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '125%',
          height: '125%',
          borderRadius: '50%',
          background: 'var(--wash1)',
          top: '-30%',
          left: '-16%',
          filter: 'blur(14px)',
          opacity: 0.65,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '90%',
          height: '90%',
          borderRadius: '50%',
          background: 'var(--wash2)',
          bottom: '-16%',
          right: '-16%',
          filter: 'blur(11px)',
          opacity: 0.5,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '55%',
          height: '55%',
          borderRadius: '50%',
          background: 'var(--wash1)',
          bottom: '14%',
          left: '-10%',
          filter: 'blur(10px)',
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 6,
          border: '1.5px solid var(--border)',
          borderRadius: 9,
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      <span style={{ ...pipStyle, top: pipOffset, left: pipOffset }}>{value}</span>

      {showBottomPip && (
        <span
          style={{
            ...pipStyle,
            bottom: pipOffset,
            right: pipOffset,
            transform: 'rotate(180deg)',
          }}
        >
          {value}
        </span>
      )}

      {showSuit && (
        <span
          style={{
            position: 'absolute',
            top: 7,
            right: 7,
            fontSize: 12,
            color: 'var(--border)',
            opacity: 0.65,
            zIndex: 4,
            lineHeight: 1,
            pointerEvents: 'none',
          }}
        >
          {c.suit}
        </span>
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: centerFontSize,
            color: 'var(--text)',
            textShadow: '1px 1px 0 rgba(255,255,255,0.7)',
            lineHeight: 1,
          }}
        >
          {value}
        </span>
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
