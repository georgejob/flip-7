import { forwardRef, useEffect, useRef, useState } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { playClickSound } from '../../hooks/useUiSound'

// A drop-in replacement for <button> that adds a satisfying physical press
// feedback: the button compresses into its own drop-shadow on press, springs
// back on release, and (per-instance) can play a click sound, render a
// radial ripple, flash a release color, and shake. Reduced-motion and
// touch-device hover are respected.
export const PressableButton = forwardRef(function PressableButton(props, ref) {
  const {
    children,
    onClick,
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    disabled = false,
    type = 'button',
    shadowDepth = 5,
    shadowColor = '#0369A1',
    pressScale = 0.97,
    hoverLift = true,
    ripple = false,
    rippleColor = 'rgba(255,255,255,0.3)',
    shake = false,
    releaseFlash = null, // { color, durationMs }
    soundProfile = 'primary',
    style,
    ...rest
  } = props

  const buttonRef = useRef(null)
  const controls = useAnimationControls()
  const [ripples, setRipples] = useState([])
  const [flashing, setFlashing] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [touchOnly, setTouchOnly] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mqHover = window.matchMedia('(hover: none)')
    setReduceMotion(mqMotion.matches)
    setTouchOnly(mqHover.matches)
    const onMotion = () => setReduceMotion(mqMotion.matches)
    const onHover = () => setTouchOnly(mqHover.matches)
    mqMotion.addEventListener?.('change', onMotion)
    mqHover.addEventListener?.('change', onHover)
    return () => {
      mqMotion.removeEventListener?.('change', onMotion)
      mqHover.removeEventListener?.('change', onHover)
    }
  }, [])

  const restShadow = `0 ${shadowDepth}px 0 ${shadowColor}`
  const pressedShadow = `0 0px 0 ${shadowColor}`
  const hoverShadow = `0 ${shadowDepth + 1}px 0 ${shadowColor}`

  const variants = {
    rest: { y: 0, scale: 1, boxShadow: restShadow },
    hover: { y: -1, scale: 1.02, boxShadow: hoverShadow },
    pressed: { y: shadowDepth, scale: pressScale, boxShadow: pressedShadow },
  }

  const handlePointerDown = (e) => {
    if (!disabled) {
      if (soundProfile && soundProfile !== 'none') playClickSound(soundProfile)
      if (ripple && !reduceMotion && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        const px = (e.clientX ?? rect.left + rect.width / 2) - rect.left
        const py = (e.clientY ?? rect.top + rect.height / 2) - rect.top
        const id =
          (typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID()) ||
          `${Date.now()}-${Math.random()}`
        setRipples((r) => [...r, { id, x: px, y: py }])
        setTimeout(() => {
          setRipples((r) => r.filter((rp) => rp.id !== id))
        }, 420)
      }
    }
    onPointerDown?.(e)
  }

  const triggerRelease = () => {
    if (disabled) return
    if (releaseFlash && releaseFlash.color) {
      const dur = releaseFlash.durationMs ?? 150
      setFlashing(true)
      setTimeout(() => setFlashing(false), dur)
    }
    if (shake && !reduceMotion) {
      controls.start({
        x: [0, -2, 2, -1, 1, 0],
        transition: { duration: 0.2, delay: 0.12 },
      })
    }
  }

  const handlePointerUp = (e) => {
    triggerRelease()
    onPointerUp?.(e)
  }

  const handlePointerLeave = (e) => {
    onPointerLeave?.(e)
  }

  const allowHover = !disabled && !touchOnly && !reduceMotion && hoverLift
  const allowTap = !disabled && !reduceMotion

  const baseStyle = {
    border: 'none',
    outline: 'none',
    appearance: 'none',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    touchAction: 'manipulation',
    overflow: 'hidden',
    cursor: disabled ? 'not-allowed' : 'pointer',
    ...style,
    position: style?.position ?? 'relative',
    boxShadow: restShadow,
  }

  // Children get wrapped so we can layer the flash + ripples without
  // disturbing the caller's flex/grid layout inside the button.
  return (
    <motion.button
      ref={(node) => {
        buttonRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      type={type}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      initial="rest"
      animate={controls}
      variants={variants}
      whileHover={allowHover ? 'hover' : undefined}
      whileTap={allowTap ? 'pressed' : undefined}
      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      style={baseStyle}
      {...rest}
    >
      <span
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          gap: 6,
          pointerEvents: 'none',
        }}
      >
        {children}
      </span>
      {releaseFlash?.color && (
        <motion.span
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: flashing ? 1 : 0 }}
          transition={{ duration: (releaseFlash.durationMs ?? 150) / 1000, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            inset: 0,
            background: releaseFlash.color,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          aria-hidden
          initial={{ scale: 0, opacity: 0.7 }}
          animate={{ scale: 6, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: r.x - 20,
            top: r.y - 20,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: rippleColor,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      ))}
    </motion.button>
  )
})
