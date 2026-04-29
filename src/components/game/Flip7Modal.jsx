import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CARD_DIMENSIONS } from './Card'
import { useAdaptiveLayout } from '../../hooks/useAdaptiveLayout'

const COUNT_UP_MS = 800
const FLIP_7_BONUS = 15

// Counts a numeric value from 0 → target over `duration` ms when `start`
// becomes truthy. Resets to 0 when start flips back to false.
function useCountUp(target, duration, start) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!start) {
      setValue(0)
      return
    }
    const startTime = performance.now()
    let raf
    const tick = (t) => {
      const elapsed = t - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  }, [target, duration, start])
  return value
}

export function Flip7Modal({ open, numbers = [], modifiers = [], onContinue }) {
  const cardsRef = useRef(null)
  const { positions } = useAdaptiveLayout(cardsRef, {
    count: numbers.length,
    cardWidth: CARD_DIMENSIONS.width,
    gap: 4,
  })

  const numberSum = numbers.reduce((s, c) => s + c.value, 0)
  const flatBonus = modifiers
    .filter((m) => m.modifier === 'plus')
    .reduce((s, m) => s + m.value, 0)
  const hasX2 = modifiers.some((m) => m.modifier === 'x2')
  const finalScore = (hasX2 ? numberSum * 2 : numberSum) + flatBonus + FLIP_7_BONUS

  const cardStaggerMs = 80
  const breakdownDelayMs = 600

  // Score breakdown + count-up start once cards have landed.
  const [showBreakdown, setShowBreakdown] = useState(false)
  useEffect(() => {
    if (!open) {
      setShowBreakdown(false)
      return
    }
    const t = setTimeout(() => setShowBreakdown(true), breakdownDelayMs)
    return () => clearTimeout(t)
  }, [open])

  const animatedScore = useCountUp(finalScore, COUNT_UP_MS, showBreakdown)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 18,
            borderRadius: 'inherit',
          }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            style={{
              background: 'white',
              border: '2.5px solid #7DD3FC',
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 300,
              textAlign: 'center',
            }}
          >
            <motion.h2
              initial={{ scale: 0.8 }}
              animate={{ scale: [0.8, 1.1, 1] }}
              transition={{ duration: 0.5, times: [0, 0.6, 1], delay: 0.1 }}
              style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: 40,
                color: '#082F49',
                textShadow: '3px 3px 0px #BAE6FD',
                margin: '0 0 6px',
                lineHeight: 1.05,
              }}
            >
              🎉 FLIP 7!
            </motion.h2>
            <p
              style={{
                color: '#0284C7',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 900,
                fontSize: 13,
                margin: '0 0 14px',
              }}
            >
              You collected 7 unique cards!
            </p>

            <div
              ref={cardsRef}
              style={{
                position: 'relative',
                height: CARD_DIMENSIONS.height + 6,
                width: '100%',
                margin: '6px 0 14px',
              }}
            >
              {numbers.map((c, i) => (
                <motion.div
                  key={`flip7-${i}-${c.value}`}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: (i * cardStaggerMs) / 1000, duration: 0.3 }}
                  style={{
                    position: 'absolute',
                    left: positions[i] ?? 0,
                    top: 0,
                    zIndex: i,
                  }}
                >
                  <Card card={c} />
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: showBreakdown ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              style={{
                fontFamily: "'Nunito', sans-serif",
                color: '#082F49',
                marginBottom: 16,
                textAlign: 'left',
              }}
            >
              <BreakdownRow label="Card total" value={numberSum} />
              {flatBonus > 0 && <BreakdownRow label="+ Modifiers" value={`+${flatBonus}`} />}
              {hasX2 && <BreakdownRow label="× 2" value="×2" />}
              <BreakdownRow label="✦ Flip 7 bonus" value="+15" />
              <div
                style={{
                  height: 1,
                  background: '#BAE6FD',
                  margin: '8px 0',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span style={{ fontWeight: 900, fontSize: 14 }}>Round total</span>
                <span style={{ fontWeight: 900, fontSize: 22, color: '#0EA5E9' }}>
                  {animatedScore}
                </span>
              </div>
            </motion.div>

            <button
              type="button"
              onClick={onContinue}
              style={{
                width: '100%',
                background: '#0EA5E9',
                border: '3px solid #0369A1',
                boxShadow: '0 4px 0 #0369A1',
                color: 'white',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 900,
                fontSize: 15,
                padding: '10px',
                borderRadius: 12,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function BreakdownRow({ label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontWeight: 800,
        fontSize: 13,
        margin: '4px 0',
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
