import { motion, AnimatePresence } from 'framer-motion'
import { Card } from './Card'
import { PressableButton } from '../ui/PressableButton'

export function BustModal({ open, card, onContinue }) {
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
            transition={{ type: 'spring', stiffness: 280, damping: 18 }}
            style={{
              background: 'white',
              border: '2.5px solid #FCA5A5',
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 280,
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: 36,
                color: '#7F1D1D',
                textShadow: '3px 3px 0px #FCA5A5',
                margin: '0 0 8px',
                lineHeight: 1.05,
              }}
            >
              💥 BUSTED!
            </h2>
            <p
              style={{
                color: '#7F1D1D',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 800,
                fontSize: 13,
                margin: '0 0 16px',
              }}
            >
              You drew a duplicate {card?.type === 'number' ? card.value : ''}
            </p>
            <motion.div
              animate={{ x: [0, -6, 6, -4, 4, 0] }}
              transition={{ duration: 0.4, delay: 0.15 }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                margin: '8px 0 14px',
                transform: 'scale(1.5)',
                transformOrigin: 'center',
                height: 84,
                alignItems: 'center',
              }}
            >
              <Card card={card} />
            </motion.div>
            <p
              style={{
                color: '#9F1239',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 900,
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                margin: '0 0 18px',
              }}
            >
              0 points this round
            </p>
            <PressableButton
              onClick={onContinue}
              shadowDepth={4}
              shadowColor="#0369A1"
              pressScale={0.96}
              releaseFlash={{ color: 'rgba(252, 165, 165, 0.4)', durationMs: 150 }}
              soundProfile="primary"
              style={{
                width: '100%',
                background: '#0EA5E9',
                border: '3px solid #0369A1',
                color: 'white',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 900,
                fontSize: 15,
                padding: '10px',
                borderRadius: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Continue
            </PressableButton>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
