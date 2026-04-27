import { useRef } from 'react'
import { motion } from 'framer-motion'
import { MiniCard, MINI_DIMENSIONS } from './MiniCard'
import { useAdaptiveLayout } from '../../hooks/useAdaptiveLayout'
import { calcRoundScore } from '../../game/engine'
import { playerColor } from './cardColors'

const STATUS = {
  active: {
    border: '2px solid #7DD3FC',
    bg: '#fff',
    extraShadow: null,
    opacity: 1,
  },
  turn: {
    border: '2px solid #0EA5E9',
    bg: '#E0F2FE',
    extraShadow: '0 0 0 2px #BAE6FD',
    opacity: 1,
  },
  stayed: {
    border: '2px solid #BBF7D0',
    bg: '#F0FDF4',
    extraShadow: null,
    opacity: 1,
  },
  frozen: {
    border: '2px solid #BFDBFE',
    bg: '#EFF6FF',
    extraShadow: null,
    opacity: 1,
  },
  busted: {
    border: '2px solid #FECACA',
    bg: '#FFF5F5',
    extraShadow: null,
    opacity: 0.5,
  },
}

const TAG = {
  turn: { bg: '#0EA5E9', color: 'white', label: 'turn' },
  bust: { bg: '#FECACA', color: '#7F1D1D', label: 'bust' },
  stay: { bg: '#BBF7D0', color: '#14532D', label: 'stay' },
  frozen: { bg: '#BFDBFE', color: '#1E3A8A', label: 'frzn' },
}

export function OtherPlayerRow({ player, isCurrentTurn, colorIndex }) {
  const containerRef = useRef(null)
  const allCards = [
    ...player.modifiers,
    ...player.numbers,
    ...(player.secondChance ? [player.secondChance] : []),
  ]
  const { positions } = useAdaptiveLayout(containerRef, {
    count: allCards.length,
    cardWidth: MINI_DIMENSIONS.modifierWidth,
    gap: 2,
  })

  const visualStatus = (() => {
    if (player.status === 'busted') return STATUS.busted
    if (player.status === 'stayed') return STATUS.stayed
    if (player.status === 'frozen') return STATUS.frozen
    if (isCurrentTurn) return STATUS.turn
    return STATUS.active
  })()

  const tag = (() => {
    if (player.status === 'busted') return TAG.bust
    if (player.status === 'stayed') return TAG.stay
    if (player.status === 'frozen') return TAG.frozen
    if (isCurrentTurn) return TAG.turn
    return null
  })()

  const score =
    player.status === 'stayed' || player.status === 'frozen'
      ? null // already banked, shown in leaderboard
      : player.status === 'busted'
        ? 0
        : calcRoundScore(player)

  const animate = player.status === 'busted' ? { x: [0, -4, 4, -3, 3, 0] } : {}

  return (
    <motion.div
      animate={animate}
      transition={{ duration: 0.4 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 8px',
        borderRadius: 10,
        border: visualStatus.border,
        background: visualStatus.bg,
        boxShadow: visualStatus.extraShadow ?? undefined,
        opacity: visualStatus.opacity,
        minWidth: 0,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: playerColor(colorIndex),
          flexShrink: 0,
        }}
      />
      <span
        style={{
          color: '#082F49',
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 900,
          fontSize: 12,
          flexShrink: 0,
          maxWidth: 70,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {player.name}
      </span>
      {tag && (
        <span
          style={{
            background: tag.bg,
            color: tag.color,
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderRadius: 6,
            padding: '1px 5px',
            flexShrink: 0,
          }}
        >
          {tag.label}
        </span>
      )}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          height: MINI_DIMENSIONS.height,
          minWidth: 0,
        }}
      >
        {allCards.map((c, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: positions[i] ?? 0,
              top: 0,
              zIndex: i,
            }}
          >
            <MiniCard card={c} />
          </div>
        ))}
      </div>
      {score !== null && (
        <span
          style={{
            color: '#0EA5E9',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: 13,
            minWidth: 24,
            textAlign: 'right',
            flexShrink: 0,
          }}
        >
          {score}
        </span>
      )}
    </motion.div>
  )
}
