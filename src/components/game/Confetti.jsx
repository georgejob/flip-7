import { useEffect, useRef } from 'react'

const COLORS = ['#BAE6FD', '#C4B5FD', '#FBCFE8', '#A5B4FC', '#A7F3D0', '#FCD34D', '#FDBA74']

// Canvas-based confetti burst from the top center, lasting `duration` ms.
// Particles fall with gravity, drift, and rotation; fade out near the end.
export function Confetti({ active, count = 100, duration = 3000 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const W = rect.width
    const startTime = performance.now()
    const particles = Array.from({ length: count }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 80,
      y: -10 - Math.random() * 30,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 2 + 1.5,
      size: Math.random() * 6 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: Math.random() < 0.5 ? 'circle' : 'rect',
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
    }))

    let raf
    const tick = (t) => {
      const elapsed = t - startTime
      const fadeStart = duration * 0.7
      const opacity =
        elapsed < fadeStart ? 1 : Math.max(0, 1 - (elapsed - fadeStart) / (duration - fadeStart))

      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
      ctx.globalAlpha = opacity

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.06
        p.rotation += p.rotationSpeed

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        }
        ctx.restore()
      }

      if (elapsed < duration) {
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  }, [active, count, duration])

  if (!active) return null
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 55,
        borderRadius: 'inherit',
      }}
    />
  )
}
