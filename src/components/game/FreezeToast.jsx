import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Non-blocking toast shown to the player who applied a Freeze card to
// someone other than themselves. Animates in from above, holds 2.5s,
// animates out.
export function FreezeToast({ open, name, onDismiss }) {
  useEffect(() => {
    if (!open) return
    const t = setTimeout(onDismiss, 2500)
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
            border: '2px solid #BFDBFE',
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
          🧊 You froze {name}!
        </motion.div>
      )}
    </AnimatePresence>
  )
}
