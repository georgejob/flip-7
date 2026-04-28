import { useEffect, useRef, useState } from 'react'
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
  bustedSnapshot,
  shakeKey = 0,
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
  const isBusted = player?.status === 'busted'

  // When busted, render the snapshot taken before the bust (engine has cleared
  // the live hand) plus the duplicate that caused the bust at the end. The
  // snapshot is computed in GameBoard.
  const display = isBusted && bustedSnapshot
    ? bustedSnapshot
    : { numbers: player?.numbers ?? [], modifiers: player?.modifiers ?? [], secondChance: player?.secondChance ?? null, bustingIndex: -1 }
  const numbers = display.numbers
  const modifiers = display.modifiers
  const secondChance = display.secondChance
  const bustingIndex = display.bustingIndex ?? -1
  const totalCards = numbers.length

  const { positions } = useAdaptiveLayout(cardsRef, {
    count: totalCards,
    cardWidth: CARD_DIMENSIONS.width,
    gap: 4,
  })

  // Score for the Stay button — only meaningful while the player is active.
  const score = player && !isBusted ? calcRoundScore(player) : 0
  const canStay = numbers.length + modifiers.length > 0
  const canAct = isMyTurn && !hasPendingAction && player?.status === 'active'

  // Red-flash + shake on the cards row when shakeKey bumps.
  const [flash, setFlash] = useState(false)
  useEffect(() => {
    if (!shakeKey) return
    setFlash(true)
    const t = setTimeout(() => setFlash(false), 500)
    return () => clearTimeout(t)
  }, [shakeKey])

  const containerBorder = isBusted ? '2.5px solid #FECACA' : '2.5px solid #7DD3FC'
  const containerBg = isBusted ? '#FFF5F5' : 'white'

  return (
    <motion.div
      animate={shakeKey ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: containerBg,
        border: containerBorder,
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
        <span
          style={{
            ...labelStyle,
            color: isBusted ? '#7F1D1D' : labelStyle.color,
          }}
        >
          Your hand · {isBusted ? 'busted' : `${totalCards} cards`}
        </span>
        <span
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: 12,
            color: isBusted ? '#7F1D1D' : '#082F49',
          }}
        >
          {isBusted ? (
            <span style={{ color: '#DC2626', fontSize: 14 }}>0 pts</span>
          ) : (
            <>
              round:{' '}
              <span style={{ color: '#0EA5E9', fontSize: 17 }}>{round}</span>
            </>
          )}
        </span>
      </div>

      {(modifiers.length > 0 || secondChance) && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            opacity: isBusted ? 0.5 : 1,
          }}
        >
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
          zIndex: 0,
        }}
      >
        <AnimatePresence>
          {numbers.map((c, i) => {
            const key = `n-${i}-${c.value}`
            const isBusting = isBusted && i === bustingIndex
            const isNewest = !isBusted && key === newestCardKey
            const glow = isBusting ? 'red' : isNewest
            // The dup card sits on top in the busted state so the red glow
            // is fully visible above neighbouring cards.
            const z = isBusting ? 200 : isNewest ? 100 : i
            // Faded for the rest of the hand, but the busting card stays
            // fully opaque so it remains visually identifiable.
            const cardOpacity = isBusted && !isBusting ? 0.5 : 1
            return (
              <motion.div
                key={key}
                initial={{ x: 80, opacity: 0, scale: 0.9 }}
                animate={
                  flash
                    ? { x: 0, opacity: cardOpacity, scale: 1, filter: 'sepia(1) hue-rotate(-50deg) saturate(4)' }
                    : { x: 0, opacity: cardOpacity, scale: 1, filter: 'none' }
                }
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                style={{
                  position: 'absolute',
                  left: positions[i] ?? 0,
                  top: 0,
                  zIndex: z,
                }}
              >
                <Card card={c} glow={glow} />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
        {isBusted ? (
          <div
            style={{
              flex: 1,
              background: '#FEE2E2',
              border: '2px solid #FCA5A5',
              boxShadow: '0 4px 0 #FCA5A5',
              borderRadius: 12,
              padding: '9px',
              textAlign: 'center',
              color: '#7F1D1D',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            💥 You busted this round
          </div>
        ) : isWaitingForOther ? (
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
    </motion.div>
  )
}
