import { motion } from 'framer-motion'
import { playerColor } from './cardColors'

const WIN_THRESHOLD = 200

export function LeaderboardRow({ rank, player, colorIndex }) {
  const pct = Math.min(100, (player.totalScore / WIN_THRESHOLD) * 100)
  const isFirst = rank === 1
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 0',
      }}
    >
      <span
        style={{
          width: 14,
          color: isFirst ? '#F59E0B' : '#BAE6FD',
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 900,
          fontSize: 10,
          flexShrink: 0,
        }}
      >
        #{rank}
      </span>
      <span
        style={{
          width: 50,
          color: '#082F49',
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 900,
          fontSize: 11,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {player.name}
      </span>
      <div
        style={{
          flex: 1,
          height: 8,
          borderRadius: 99,
          background: '#E0F2FE',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: playerColor(colorIndex),
            borderRadius: 99,
          }}
        />
      </div>
      <span
        style={{
          width: 30,
          textAlign: 'right',
          color: '#0284C7',
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 900,
          fontSize: 11,
          flexShrink: 0,
        }}
      >
        {player.totalScore}
      </span>
    </div>
  )
}
