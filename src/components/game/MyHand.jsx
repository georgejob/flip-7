import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CARD_DIMENSIONS } from './Card'
import { useAdaptiveLayout } from '../../hooks/useAdaptiveLayout'
import { calcRoundScore } from '../../game/engine'

const labelStyle = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: '#0284C7',
}

export function MyHand({
  player,
  round,
  isMyTurn,
  isWaitingForOther,
  waitingForName,
  hasPendingAction,
  newestCardKey,
  onHit,
  onStay,
  pending,
}) {
  const cardsRef = useRef(null)
  const numbers = player?.numbers ?? []
  const modifiers = player?.modifiers ?? []
  const secondChance = player?.secondChance ?? null
  const totalCards = numbers.length

  const { positions } = useAdaptiveLayout(cardsRef, {
    count: totalCards,
    cardWidth: CARD_DIMENSIONS.width,
    gap: 4,
  })

  const score = player ? calcRoundScore(player) : 0
  const canStay = numbers.length + modifiers.length > 0
  const canAct = isMyTurn && !hasPendingAction && player?.status === 'active'

  return (
    <div
      style={{
        background: 'white',
        border: '2.5px solid #7DD3FC',
        borderRadius: 16,
        padding: 10,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minHeight: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={labelStyle}>Your hand · {totalCards} cards</span>
        <span
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: 12,
            color: '#082F49',
          }}
        >
          round:{' '}
          <span style={{ color: '#0EA5E9', fontSize: 17 }}>{round}</span>
        </span>
      </div>

      {(modifiers.length > 0 || secondChance) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {modifiers.map((m, i) => (
            <Card key={`mod-${i}`} card={m} />
          ))}
          {secondChance && <Card card={secondChance} />}
        </div>
      )}

      <div
        ref={cardsRef}
        style={{
          position: 'relative',
          height: CARD_DIMENSIONS.height + 4,
          width: '100%',
        }}
      >
        <AnimatePresence>
          {numbers.map((c, i) => {
            const key = `n-${i}-${c.value}`
            const isNewest = key === newestCardKey
            return (
              <motion.div
                key={key}
                initial={{ x: 80, opacity: 0, scale: 0.9 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                style={{
                  position: 'absolute',
                  left: positions[i] ?? 0,
                  top: 0,
                  zIndex: isNewest ? 100 : i,
                }}
              >
                <Card card={c} glow={isNewest} />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
        {isWaitingForOther ? (
          <div
            style={{
              flex: 1,
              border: '2px dashed #BAE6FD',
              background: '#F0F9FF',
              borderRadius: 12,
              padding: '9px',
              textAlign: 'center',
              color: '#BAE6FD',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: 12,
            }}
          >
            ⏳ waiting for {waitingForName ?? 'next player'}…
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onHit}
              disabled={!canAct || pending}
              style={{
                flex: 1,
                background: canAct ? '#0EA5E9' : '#E0F2FE',
                border: canAct ? '3px solid #0369A1' : '3px solid #BAE6FD',
                boxShadow: canAct ? '0 4px 0 #0369A1' : '0 4px 0 #BAE6FD',
                color: canAct ? 'white' : '#7DD3FC',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 900,
                fontSize: 15,
                padding: '9px',
                borderRadius: 12,
                cursor: canAct && !pending ? 'pointer' : 'not-allowed',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Hit
            </button>
            <button
              type="button"
              onClick={onStay}
              disabled={!canAct || !canStay || pending}
              style={{
                flex: 1,
                background: canAct && canStay ? '#A7F3D0' : '#E0F2FE',
                border: canAct && canStay ? '3px solid #34D399' : '3px solid #BAE6FD',
                boxShadow: canAct && canStay ? '0 4px 0 #34D399' : '0 4px 0 #BAE6FD',
                color: canAct && canStay ? '#064E3B' : '#7DD3FC',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 900,
                fontSize: 15,
                padding: '9px',
                borderRadius: 12,
                cursor: canAct && canStay && !pending ? 'pointer' : 'not-allowed',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Stay ({score} pts)
            </button>
          </>
        )}
      </div>
    </div>
  )
}
