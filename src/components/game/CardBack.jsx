const DEFAULT_W = 38
const DEFAULT_H = 54

export function CardBack({ width, height, style }) {
  const w = width ?? DEFAULT_W
  const h = height ?? DEFAULT_H
  const stripe = Math.max(6, Math.round(w * 0.18))
  const half = Math.round(stripe / 2)
  const logoSize = Math.max(11, Math.round(w * 0.36))

  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 14,
        border: '2.5px solid #7DD3FC',
        background: '#BAE6FD',
        boxShadow: '0 4px 0 #7DD3FC, 0 6px 18px rgba(0,0,0,0.10)',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `repeating-linear-gradient(45deg, rgba(125,211,252,0.55) 0px, rgba(125,211,252,0.55) ${half}px, transparent ${half}px, transparent ${stripe}px)`,
          opacity: 0.7,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 6,
          border: '1.5px solid rgba(14,165,233,0.45)',
          borderRadius: 9,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: logoSize,
            color: '#0EA5E9',
            textShadow: '1px 1px 0 rgba(255,255,255,0.7)',
            lineHeight: 1,
            letterSpacing: '0.02em',
          }}
        >
          F<span style={{ color: '#0284C7' }}>7</span>
        </span>
      </div>
    </div>
  )
}
