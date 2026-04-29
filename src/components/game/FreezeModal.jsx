import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const COUNT_UP_MS = 600

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

export function FreezeModal({
  open,
  fromName,
  isSelfFreeze = false,
  pointsBanked = 0,
  endsRound = false,
  onContinue,
}) {
  const animatedScore = useCountUp(pointsBanked, COUNT_UP_MS, open)

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
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{
              background: 'white',
              border: '2.5px solid #BFDBFE',
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 280,
              textAlign: 'center',
            }}
          >
            <motion.h2
              animate={{ color: ['#1E3A8A', '#93C5FD', '#1E3A8A'] }}
              transition={{ duration: 0.8, times: [0, 0.5, 1], delay: 0.1 }}
              style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: 38,
                color: '#1E3A8A',
                textShadow: '3px 3px 0px #BFDBFE',
                margin: '0 0 6px',
                lineHeight: 1.05,
              }}
            >
              🧊 Frozen!
            </motion.h2>
            <p
              style={{
                color: '#1D4ED8',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 900,
                fontSize: 13,
                margin: '0 0 16px',
              }}
            >
              {isSelfFreeze
                ? 'You played Freeze on yourself!'
                : `${fromName ?? 'Someone'} froze you!`}
            </p>

            <motion.div
              initial={{ rotate: -15, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                margin: '8px 0 16px',
              }}
            >
              <FreezeBigCard />
            </motion.div>

            <div
              style={{
                fontFamily: "'Nunito', sans-serif",
                marginBottom: endsRound ? 6 : 18,
              }}
            >
              <div
                style={{
                  color: '#0EA5E9',
                  fontWeight: 900,
                  fontSize: 18,
                }}
              >
                Points banked: {animatedScore}
              </div>
              <div
                style={{
                  color: '#93C5FD',
                  fontWeight: 700,
                  fontSize: 11,
                  marginTop: 2,
                }}
              >
                Your points are locked in for this round
              </div>
            </div>

            {endsRound && (
              <div
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontStyle: 'italic',
                  color: '#93C5FD',
                  fontWeight: 700,
                  fontSize: 11,
                  marginBottom: 14,
                }}
              >
                You were the last active player — the round has ended.
              </div>
            )}

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

function FreezeBigCard() {
  return (
    <div
      style={{
        width: 100,
        height: 130,
        borderRadius: 14,
        border: '2.5px solid #BFDBFE',
        background: 'white',
        boxShadow: '0 4px 0 #BFDBFE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
      }}
    >
      <div
        style={{
          flex: 1,
          height: '100%',
          borderRadius: 8,
          background: '#EFF6FF',
          border: '2px solid #BFDBFE',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <div style={{ fontSize: 32, lineHeight: 1 }}>🧊</div>
        <div
          style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 18,
            color: '#1E3A8A',
          }}
        >
          Freeze
        </div>
      </div>
    </div>
  )
}
