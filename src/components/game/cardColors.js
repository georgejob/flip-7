// Card color palette — cycles by number value, repeating every 5.
export const NUMBER_PALETTE = [
  { bg: '#BAE6FD', border: '#38BDF8', innerBg: '#E0F2FE', innerBorder: '#7DD3FC' },
  { bg: '#C4B5FD', border: '#A78BFA', innerBg: '#EDE9FE', innerBorder: '#C4B5FD' },
  { bg: '#FBCFE8', border: '#F472B6', innerBg: '#FCE7F3', innerBorder: '#F9A8D4' },
  { bg: '#A5B4FC', border: '#818CF8', innerBg: '#E0E7FF', innerBorder: '#A5B4FC' },
  { bg: '#A7F3D0', border: '#6EE7B7', innerBg: '#D1FAE5', innerBorder: '#86EFAC' },
]

export function paletteForValue(value) {
  return NUMBER_PALETTE[value % NUMBER_PALETTE.length]
}

export const PLAYER_DOT_COLORS = ['#0EA5E9', '#A78BFA', '#F472B6', '#A5B4FC', '#A7F3D0', '#FCD34D']

export function playerColor(index) {
  return PLAYER_DOT_COLORS[index % PLAYER_DOT_COLORS.length]
}
