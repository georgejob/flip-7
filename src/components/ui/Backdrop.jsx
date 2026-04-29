export function Backdrop() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        borderRadius: 'inherit',
      }}
    >
      <div style={circle('#BAE6FD', 0.55, 200, -60, -60)} />
      <div style={circle('#DDD6FE', 0.45, 160, 280, 40)} />
      <div style={circle('#FBCFE8', 0.4, 130, -40, 360)} />
      <div style={circle('#A7F3D0', 0.35, 110, 300, 540)} />
      <div style={circle('#FCD34D', 0.4, 70, 80, 220)} />
      <div style={circle('#A5B4FC', 0.4, 90, 250, 660)} />

      <div style={confettiSquare('#F472B6', 0.45, 12, 60, 80)} />
      <div style={confettiSquare('#A78BFA', 0.5, 10, 320, 160)} />
      <div style={confettiSquare('#0EA5E9', 0.4, 14, 30, 480)} />
      <div style={confettiSquare('#FCD34D', 0.5, 11, 360, 460)} />
      <div style={confettiSquare('#6EE7B7', 0.45, 13, 200, 720)} />
      <div style={confettiSquare('#F472B6', 0.4, 9, 350, 700)} />

      <div style={dot('#A78BFA', 0.55, 6, 110, 200)} />
      <div style={dot('#0EA5E9', 0.5, 5, 340, 280)} />
      <div style={dot('#F472B6', 0.5, 7, 50, 400)} />
      <div style={dot('#6EE7B7', 0.5, 6, 270, 600)} />
      <div style={dot('#FCD34D', 0.5, 5, 100, 660)} />

      <Sparkle x={40} y={140} size={14} color="#A78BFA" opacity={0.5} />
      <Sparkle x={350} y={100} size={16} color="#FCD34D" opacity={0.55} />
      <Sparkle x={300} y={380} size={12} color="#F472B6" opacity={0.5} />
      <Sparkle x={70} y={580} size={14} color="#0EA5E9" opacity={0.5} />
      <Sparkle x={330} y={620} size={16} color="#A7F3D0" opacity={0.5} />

      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 760"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0 }}
      >
        <path
          d="M -20 240 Q 100 200 200 250 T 420 220"
          stroke="#A78BFA"
          strokeWidth="4"
          fill="none"
          opacity="0.4"
          strokeLinecap="round"
        />
        <path
          d="M -20 540 Q 120 580 220 540 T 420 560"
          stroke="#0EA5E9"
          strokeWidth="4"
          fill="none"
          opacity="0.4"
          strokeLinecap="round"
        />
        <path
          d="M -20 90 Q 80 70 160 100"
          stroke="#F472B6"
          strokeWidth="3"
          fill="none"
          opacity="0.45"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

function circle(color, opacity, size, x, y) {
  return {
    position: 'absolute',
    left: x,
    top: y,
    width: size,
    height: size,
    borderRadius: '50%',
    background: color,
    opacity,
    filter: 'blur(2px)',
  }
}

function confettiSquare(color, opacity, size, x, y) {
  return {
    position: 'absolute',
    left: x,
    top: y,
    width: size,
    height: size,
    background: color,
    opacity,
    transform: `rotate(${(x * y) % 60 - 30}deg)`,
    borderRadius: 2,
  }
}

function dot(color, opacity, size, x, y) {
  return {
    position: 'absolute',
    left: x,
    top: y,
    width: size,
    height: size,
    background: color,
    opacity,
    borderRadius: '50%',
  }
}

function Sparkle({ x, y, size, color, opacity }) {
  return (
    <span
      style={{
        position: 'absolute',
        left: x,
        top: y,
        fontSize: size,
        color,
        opacity,
        lineHeight: 1,
      }}
    >
      ✦
    </span>
  )
}
