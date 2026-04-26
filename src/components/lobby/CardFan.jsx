const CARDS = [
  { bg: '#BAE6FD', border: '#38BDF8', innerBg: '#E0F2FE', innerBorder: '#7DD3FC', symbol: '✦', pip: 7, rotate: -18 },
  { bg: '#C4B5FD', border: '#A78BFA', innerBg: '#EDE9FE', innerBorder: '#C4B5FD', symbol: '♦', pip: 4, rotate: -9 },
  { bg: '#FBCFE8', border: '#F472B6', innerBg: '#FCE7F3', innerBorder: '#F9A8D4', symbol: '♥', pip: 9, rotate: 0 },
  { bg: '#A5B4FC', border: '#818CF8', innerBg: '#E0E7FF', innerBorder: '#A5B4FC', symbol: '★', pip: 12, rotate: 9 },
  { bg: '#A7F3D0', border: '#6EE7B7', innerBg: '#D1FAE5', innerBorder: '#86EFAC', symbol: '♣', pip: 5, rotate: 18 },
]

export function CardFan() {
  return (
    <div
      style={{
        position: 'relative',
        height: 150,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
      }}
    >
      {CARDS.map((c, i) => {
        const offsetX = (i - 2) * 22
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              transform: `translateX(${offsetX}px) rotate(${c.rotate}deg)`,
              width: 70,
              height: 100,
              background: c.bg,
              border: `3px solid ${c.border}`,
              borderRadius: 10,
              boxShadow: `0 3px 0 ${c.border}`,
              padding: 6,
              display: 'flex',
              flexDirection: 'column',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              color: '#082F49',
              zIndex: i === 2 ? 5 : 5 - Math.abs(i - 2),
            }}
          >
            <div style={{ fontSize: 11, lineHeight: 1, display: 'flex', justifyContent: 'space-between' }}>
              <span>{c.pip}</span>
              <span style={{ color: c.border }}>{c.symbol}</span>
            </div>
            <div
              style={{
                flex: 1,
                margin: '4px 0',
                background: c.innerBg,
                border: `2px solid ${c.innerBorder}`,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                color: c.border,
              }}
            >
              {c.symbol}
            </div>
            <div
              style={{
                fontSize: 11,
                lineHeight: 1,
                display: 'flex',
                justifyContent: 'space-between',
                transform: 'rotate(180deg)',
              }}
            >
              <span>{c.pip}</span>
              <span style={{ color: c.border }}>{c.symbol}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
