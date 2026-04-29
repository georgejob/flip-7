export function Logo({ size = 58 }) {
  return (
    <h1
      style={{
        fontFamily: "'Fredoka One', cursive",
        fontSize: size,
        margin: 0,
        color: '#082F49',
        textShadow: '3px 3px 0px #BAE6FD',
        letterSpacing: '0.02em',
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      Flip{' '}
      <span
        style={{
          color: '#0EA5E9',
          textShadow: '3px 3px 0px #7DD3FC',
        }}
      >
        7
      </span>
    </h1>
  )
}
