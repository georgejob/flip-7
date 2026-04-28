import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Non-blocking toast shown to other clients when one player achieves Flip 7.
// Animates in from above, holds 3s, animates out.
export function Flip7Toast({ open, name, onDismiss }) {
  useEffect(() => {
    if (!open) return
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [open, onDismiss])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 70,
            background: 'white',
            border: '2px solid #7DD3FC',
            borderRadius: 12,
            padding: '12px 16px',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            color: '#082F49',
            fontSize: 13,
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          ⭐ {name} flipped 7! Round over.
        </motion.div>
      )}
    </AnimatePresence>
  )
}
