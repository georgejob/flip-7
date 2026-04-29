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

// Per-value watercolor card palette (0–12). Each entry drives the inline CSS
// custom properties on the card root so all decorative layers (blobs, frame,
// pip, shadow, text) share a coherent hue.
export const CARD_COLORS = {
  0:  { wash1: '#FEF9C3', wash2: '#FDE68A', border: '#EAB308', shadow: '#CA8A04', text: '#713F12', suit: '✦' },
  1:  { wash1: '#FFE4E6', wash2: '#FECDD3', border: '#FB7185', shadow: '#E11D48', text: '#881337', suit: '♠' },
  2:  { wash1: '#FFEDD5', wash2: '#FED7AA', border: '#FB923C', shadow: '#EA580C', text: '#7C2D12', suit: '◆' },
  3:  { wash1: '#FEF3C7', wash2: '#FDE68A', border: '#FBBF24', shadow: '#D97706', text: '#78350F', suit: '▲' },
  4:  { wash1: '#DCFCE7', wash2: '#BBF7D0', border: '#4ADE80', shadow: '#16A34A', text: '#14532D', suit: '♣' },
  5:  { wash1: '#CFFAFE', wash2: '#A5F3FC', border: '#22D3EE', shadow: '#0891B2', text: '#164E63', suit: '❋' },
  6:  { wash1: '#DBEAFE', wash2: '#BFDBFE', border: '#60A5FA', shadow: '#2563EB', text: '#1E3A8A', suit: '♡' },
  7:  { wash1: '#BAE6FD', wash2: '#7DD3FC', border: '#38BDF8', shadow: '#0EA5E9', text: '#0C4A6E', suit: '✿' },
  8:  { wash1: '#C4B5FD', wash2: '#A78BFA', border: '#8B5CF6', shadow: '#7C3AED', text: '#2E1065', suit: '★' },
  9:  { wash1: '#FBCFE8', wash2: '#F9A8D4', border: '#EC4899', shadow: '#DB2777', text: '#831843', suit: '♥' },
  10: { wash1: '#FECACA', wash2: '#FCA5A5', border: '#F87171', shadow: '#DC2626', text: '#7F1D1D', suit: '⬟' },
  11: { wash1: '#A7F3D0', wash2: '#6EE7B7', border: '#10B981', shadow: '#059669', text: '#064E3B', suit: '✶' },
  12: { wash1: '#A5B4FC', wash2: '#818CF8', border: '#6366F1', shadow: '#4F46E5', text: '#1E1B4B', suit: '♦' },
}

export function cardColorsFor(value) {
  return CARD_COLORS[value] ?? CARD_COLORS[0]
}

export const PLAYER_DOT_COLORS = ['#0EA5E9', '#A78BFA', '#F472B6', '#A5B4FC', '#A7F3D0', '#FCD34D']

export function playerColor(index) {
  return PLAYER_DOT_COLORS[index % PLAYER_DOT_COLORS.length]
}
