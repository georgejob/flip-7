import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from './Card'

const SECOND_CHANCE_CARD = { type: 'action', action: 'secondChance' }

export function SecondChanceModal({ open, card, onDismiss }) {
  useEffect(() => {
    if (!open) return
    const t = setTimeout(onDismiss, 2000)
    return () => clearTimeout(t)
  }, [open, onDismiss])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onDismiss}
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
            cursor: 'pointer',
          }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              border: '2.5px solid #6EE7B7',
              borderRadius: 20,
              padding: 22,
              width: '100%',
              maxWidth: 280,
              textAlign: 'center',
              cursor: 'default',
            }}
          >
            <h2
              style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: 24,
                color: '#064E3B',
                margin: '0 0 6px',
                lineHeight: 1.05,
              }}
            >
              🛡 Second Chance!
            </h2>
            <p
              style={{
                color: '#065F46',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 800,
                fontSize: 12,
                margin: '0 0 14px',
              }}
            >
              Saved you from a duplicate {card?.type === 'number' ? card.value : ''}
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 12,
                margin: '4px 0 4px',
              }}
            >
              <Card card={card} />
              <Card card={SECOND_CHANCE_CARD} />
            </div>
            <p
              style={{
                color: '#10B981',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 900,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                margin: '12px 0 0',
              }}
            >
              tap to dismiss
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
