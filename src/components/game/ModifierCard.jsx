import { getCardDetailLevel } from '../../hooks/useAdaptiveLayout'

// Reference design size — used to scale absolute pixel values like sparkle
// positions, fonts, and insets. Cards rendered at any other size scale
// proportionally from these baselines.
const BASE_W = 80
const BASE_H = 112

// Default render size when no width/height props are passed. Matches
// NumberCard's defaults so modal usages line up with number cards.
const DEFAULT_W = 38
const DEFAULT_H = 54

const BLUE_GLOW = '0 0 0 3px rgba(14, 165, 233, 0.35), 0 4px 8px rgba(14, 165, 233, 0.25)'
const RED_GLOW = '0 0 0 3px rgba(239, 68, 68, 0.4), 0 4px 8px rgba(239, 68, 68, 0.25)'

function glowShadow(glow) {
  if (glow === 'red') return RED_GLOW
  if (glow) return BLUE_GLOW
  return null
}

export const MODIFIER_COLORS = {
  '+2': {
    grad: 'linear-gradient(145deg,#2C1800 0%,#5A3200 18%,#8C5000 34%,#C87A18 50%,#E8A840 58%,#F5CC80 63%,#C87A18 70%,#5A3200 84%,#2C1800 100%)',
    border: '#D97706', shadow: '#92400E',
    sheen: 'rgba(255,220,140,0.45)', frame: 'rgba(232,168,64,0.5)',
    accent: 'rgba(255,235,180,0.9)', glow: 'rgba(217,119,6,0.72)', spark: '#FDE68A',
    numGrad: 'linear-gradient(160deg,#FEF3C7 0%,#FDE68A 35%,#fff 55%,#FDE68A 75%,#FEF3C7 100%)',
    tagBg: 'rgba(255,237,160,0.22)', tagBorder: 'rgba(253,230,138,0.32)', tagText: '#FEF9C3',
    icon: '✨', suit: '✦', label: 'bonus',
    miniA: '#C87A18', miniB: '#F5CC80',
  },
  '+4': {
    grad: 'linear-gradient(145deg,#220E00 0%,#481C00 18%,#7A3000 34%,#B85010 50%,#D97020 58%,#F09850 63%,#B85010 70%,#481C00 84%,#220E00 100%)',
    border: '#C2410C', shadow: '#7C2D12',
    sheen: 'rgba(255,190,100,0.45)', frame: 'rgba(210,112,32,0.5)',
    accent: 'rgba(255,210,160,0.9)', glow: 'rgba(194,65,12,0.75)', spark: '#FDBA74',
    numGrad: 'linear-gradient(160deg,#FED7AA 0%,#FDBA74 35%,#fff8f0 55%,#FDBA74 75%,#FED7AA 100%)',
    tagBg: 'rgba(253,186,116,0.18)', tagBorder: 'rgba(253,186,116,0.28)', tagText: '#FED7AA',
    icon: '🔥', suit: '✦', label: 'bonus',
    miniA: '#B85010', miniB: '#F09850',
  },
  '+6': {
    grad: 'linear-gradient(145deg,#1A0000 0%,#3A0808 18%,#6E1010 34%,#A82020 50%,#CC3828 58%,#E86050 63%,#A82020 70%,#3A0808 84%,#1A0000 100%)',
    border: '#DC2626', shadow: '#7F1D1D',
    sheen: 'rgba(255,160,140,0.45)', frame: 'rgba(220,38,38,0.45)',
    accent: 'rgba(255,200,190,0.9)', glow: 'rgba(220,38,38,0.78)', spark: '#FCA5A5',
    numGrad: 'linear-gradient(160deg,#FECACA 0%,#FCA5A5 35%,#fff5f5 55%,#FCA5A5 75%,#FECACA 100%)',
    tagBg: 'rgba(252,165,165,0.16)', tagBorder: 'rgba(252,165,165,0.26)', tagText: '#FEE2E2',
    icon: '💥', suit: '✦', label: 'bonus',
    miniA: '#A82020', miniB: '#E86050',
  },
  '+8': {
    grad: 'linear-gradient(145deg,#180010 0%,#340824 18%,#601040 34%,#941A5E 50%,#B82878 58%,#D8609A 63%,#941A5E 70%,#340824 84%,#180010 100%)',
    border: '#BE185D', shadow: '#831843',
    sheen: 'rgba(255,140,190,0.45)', frame: 'rgba(190,24,93,0.45)',
    accent: 'rgba(255,190,220,0.9)', glow: 'rgba(190,24,93,0.78)', spark: '#FDA4AF',
    numGrad: 'linear-gradient(160deg,#FBCFE8 0%,#F9A8D4 35%,#fff0f8 55%,#F9A8D4 75%,#FBCFE8 100%)',
    tagBg: 'rgba(253,164,175,0.16)', tagBorder: 'rgba(253,164,175,0.26)', tagText: '#FCE7F3',
    icon: '💎', suit: '✦', label: 'bonus',
    miniA: '#941A5E', miniB: '#D8609A',
  },
  '+10': {
    grad: 'linear-gradient(145deg,#0E0018 0%,#200430 18%,#400860 34%,#681094 50%,#8820B8 58%,#AA58D8 63%,#681094 70%,#200430 84%,#0E0018 100%)',
    border: '#7C3AED', shadow: '#4C1D95',
    sheen: 'rgba(200,150,255,0.45)', frame: 'rgba(124,58,237,0.45)',
    accent: 'rgba(230,200,255,0.9)', glow: 'rgba(124,58,237,0.82)', spark: '#C4B5FD',
    numGrad: 'linear-gradient(160deg,#EDE9FE 0%,#C4B5FD 35%,#f8f5ff 55%,#C4B5FD 75%,#EDE9FE 100%)',
    tagBg: 'rgba(196,181,253,0.16)', tagBorder: 'rgba(196,181,253,0.26)', tagText: '#EDE9FE',
    icon: '💫', suit: '✦', label: 'bonus',
    miniA: '#681094', miniB: '#AA58D8',
  },
  'x2': {
    grad: 'linear-gradient(145deg,#0A0800 0%,#1C1400 12%,#2E2000 24%,#5C4000 36%,#8C6400 48%,#B88A00 56%,#D4AA20 62%,#F0CC50 67%,#D4AA20 72%,#8C6400 80%,#2E2000 90%,#0A0800 100%)',
    border: '#D4A017', shadow: '#5C3D00',
    sheen: 'rgba(255,235,120,0.55)', frame: 'rgba(240,204,80,0.55)',
    accent: 'rgba(255,248,200,0.95)', glow: 'rgba(212,160,23,0.9)', spark: '#FEF08A',
    numGrad: 'linear-gradient(160deg,#FEF9C3 0%,#FDE68A 20%,#F5C842 38%,#fff8d0 52%,#F5C842 66%,#FDE68A 82%,#FEF9C3 100%)',
    tagBg: 'rgba(245,200,66,0.22)', tagBorder: 'rgba(212,160,23,0.5)', tagText: '#FEF9C3',
    icon: '⚡', suit: '⚡', label: 'double',
    miniA: '#8C6400', miniB: '#F0CC50',
  },
  'second': {
    grad: 'linear-gradient(145deg,#001A0D 0%,#003322 15%,#006644 30%,#00A86B 46%,#00D48A 54%,#5DEBB8 60%,#00A86B 68%,#003322 82%,#001A0D 100%)',
    border: '#10B981', shadow: '#064E3B',
    sheen: 'rgba(160,255,220,0.4)', frame: 'rgba(93,235,184,0.45)',
    accent: 'rgba(158,247,216,0.85)', glow: 'rgba(0,201,127,0.7)', spark: '#9EF7D8',
    numGrad: 'linear-gradient(160deg,#D1FAE5 0%,#9EF7D8 35%,#f0fffa 55%,#9EF7D8 75%,#D1FAE5 100%)',
    tagBg: 'rgba(209,250,229,0.22)', tagBorder: 'rgba(93,235,184,0.35)', tagText: '#D1FAE5',
    icon: '🛡', suit: '✦', label: 'chance',
    miniA: '#00A86B', miniB: '#5DEBB8',
  },
}

// Maps an engine card object to a MODIFIER_COLORS key.
export function modifierTypeFor(card) {
  if (!card) return null
  if (card.type === 'action' && card.action === 'secondChance') return 'second'
  if (card.type === 'modifier') {
    if (card.modifier === 'x2') return 'x2'
    if (card.modifier === 'plus') return `+${card.value}`
  }
  return null
}

export function ModifierCard({ type, glow, style, width, height }) {
  const c = MODIFIER_COLORS[type]
  if (!c) return null

  const w = width ?? DEFAULT_W
  const h = height ?? DEFAULT_H
  const scale = w / BASE_W
  const detail = getCardDetailLevel(w)

  const px = (n) => Math.max(1, Math.round(n * scale))

  const radius = Math.max(6, Math.round(14 * scale))
  const innerRadius = Math.max(4, Math.round(9 * scale))
  const stripHeight = Math.round(detail === 'minimal' || detail === 'compact' ? 18 + (24 - 18) * Math.min(1, scale) : Math.max(18, 24 * scale))
  const innerInset = px(6)
  const innerBottomOffset = stripHeight + Math.round(4 * scale)
  const isWideNum = type === '+10' || type === 'second'
  const numFontSize = Math.max(10, Math.round((isWideNum ? 24 : 30) * scale))
  const iconFontSize = Math.max(10, Math.round(20 * scale))
  const suitFontSize = Math.max(8, Math.round(13 * scale))
  const decoFontSize = Math.max(7, Math.round(9 * scale))
  const labelFontSize = Math.max(7, Math.round(9 * scale))
  const isX2 = type === 'x2'

  const baseShadow = `0 ${px(5)}px 0 ${c.shadow}, 0 ${px(8)}px ${px(24)}px rgba(0,0,0,0.22)`

  const showInnerFrame = detail !== 'minimal'
  const showSheen = detail !== 'minimal'
  const showSuit = detail === 'full'
  const showDeco = detail === 'full'
  const showSparkle1 = detail !== 'minimal'
  const showSparkle2 = detail === 'full' || detail === 'medium'
  const showSparkle3 = detail === 'full'
  const showIcon = true
  const showNumber = detail !== 'minimal'

  // Display value text (the number/×2 figure on the front of the card)
  const valueText =
    type === 'x2' ? '×2' : type === 'second' ? '2nd' : type

  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        border: `${Math.max(1.5, 2.5 * scale)}px solid ${c.border}`,
        boxShadow: glowShadow(glow) ?? baseShadow,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: Math.round(stripHeight * 1),
        background: '#000',
        ...style,
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: c.grad,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* x2-only radial glow */}
      {isX2 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 40%, rgba(245,200,66,0.18) 0%, transparent 70%)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Sheen layer */}
      {showSheen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(122deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 28%, ${c.sheen} 46%, rgba(255,255,255,0.38) 52%, rgba(255,255,255,0) 68%, rgba(255,255,255,0) 100%)`,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* x2-only second cross-sheen */}
      {isX2 && showSheen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(200deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 55%, rgba(255,248,180,0.22) 68%, rgba(255,255,255,0.12) 72%, rgba(255,255,255,0) 85%)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Inner frame */}
      {showInnerFrame && (
        <div
          style={{
            position: 'absolute',
            top: innerInset,
            left: innerInset,
            right: innerInset,
            bottom: innerBottomOffset,
            border: `${Math.max(1, 1.5 * scale)}px solid ${c.frame}`,
            borderRadius: innerRadius,
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />
      )}

      {/* x2-only inner ornament ring */}
      {isX2 && showInnerFrame && (
        <div
          style={{
            position: 'absolute',
            top: px(10),
            left: px(10),
            right: px(10),
            bottom: innerBottomOffset + px(4),
            border: `${Math.max(0.5, 0.75 * scale)}px solid rgba(245,200,66,0.28)`,
            borderRadius: Math.max(3, Math.round(7 * scale)),
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />
      )}

      {/* Suit symbol */}
      {showSuit && (
        <span
          style={{
            position: 'absolute',
            top: px(9),
            right: px(10),
            fontSize: suitFontSize,
            color: c.accent,
            zIndex: 6,
            filter: `drop-shadow(0 0 ${px(4)}px ${c.glow})`,
            lineHeight: 1,
            pointerEvents: 'none',
          }}
        >
          {c.suit}
        </span>
      )}

      {/* Deco ornament */}
      {showDeco && (
        <span
          style={{
            position: 'absolute',
            bottom: stripHeight + px(6),
            left: px(10),
            fontSize: decoFontSize,
            color: c.accent,
            opacity: 0.45,
            zIndex: 6,
            letterSpacing: '1px',
            lineHeight: 1,
            pointerEvents: 'none',
          }}
        >
          {c.suit}
        </span>
      )}

      {/* Sparkle 1 */}
      {showSparkle1 && (
        <div
          style={{
            position: 'absolute',
            width: isX2 ? px(6) : px(5),
            height: isX2 ? px(6) : px(5),
            borderRadius: '50%',
            background: c.spark,
            top: px(22),
            right: px(14),
            zIndex: 5,
            boxShadow: isX2
              ? `0 0 ${px(10)}px rgba(245,200,66,1), 0 0 ${px(20)}px rgba(245,200,66,0.5)`
              : `0 0 ${px(8)}px ${c.glow}`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Sparkle 2 */}
      {showSparkle2 && (
        <div
          style={{
            position: 'absolute',
            width: px(3),
            height: px(3),
            borderRadius: '50%',
            background: c.spark,
            bottom: stripHeight + px(14),
            left: px(14),
            zIndex: 5,
            boxShadow: `0 0 ${px(5)}px ${c.glow}`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Sparkle 3 */}
      {showSparkle3 && (
        <div
          style={{
            position: 'absolute',
            width: px(2),
            height: px(2),
            borderRadius: '50%',
            background: c.spark,
            top: px(38),
            left: px(10),
            zIndex: 5,
            opacity: 0.7,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* x2-only fourth sparkle */}
      {isX2 && showSparkle1 && (
        <div
          style={{
            position: 'absolute',
            width: px(4),
            height: px(4),
            borderRadius: '50%',
            background: '#FEF9C3',
            top: px(36),
            left: px(14),
            zIndex: 5,
            boxShadow: `0 0 ${px(6)}px rgba(245,200,66,0.9)`,
            opacity: 0.7,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Icon */}
      {showIcon && (
        <span
          style={{
            fontSize: iconFontSize,
            position: 'relative',
            zIndex: 5,
            filter: `drop-shadow(0 0 ${px(6)}px ${c.glow})`,
            marginBottom: px(3),
            lineHeight: 1,
            pointerEvents: 'none',
          }}
        >
          {c.icon}
        </span>
      )}

      {/* Value (gradient text) */}
      {showNumber && (
        <span
          style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: numFontSize,
            position: 'relative',
            zIndex: 5,
            lineHeight: 1,
            background: c.numGrad,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
            filter: `drop-shadow(0 ${px(2)}px ${px(6)}px ${c.glow}) drop-shadow(0 0 ${px(2)}px rgba(0,0,0,0.5))`,
            pointerEvents: 'none',
          }}
        >
          {valueText}
        </span>
      )}

      {/* Frosted label strip */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: stripHeight,
          background: c.tagBg,
          borderTop: `${Math.max(1, 1.5 * scale)}px solid ${c.tagBorder}`,
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Nunito', sans-serif",
          fontSize: labelFontSize,
          fontWeight: 900,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: c.tagText,
          zIndex: 6,
          pointerEvents: 'none',
        }}
      >
        {c.label}
      </div>
    </div>
  )
}
