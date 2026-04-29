import { useEffect, useState } from 'react'

// Measures `ref.current` width via ResizeObserver and returns positions for
// `count` cards of `cardWidth`, separated by `gap` when there's room. When
// there isn't room, cards spread across the container so the first sits at
// 0 and the last at `containerWidth - cardWidth`.
export function useAdaptiveLayout(ref, { count, cardWidth, gap }) {
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect?.width ?? el.clientWidth
        setContainerWidth(w)
      }
    })
    ro.observe(el)
    setContainerWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [ref])

  if (count <= 0) return { positions: [], containerWidth }
  if (count === 1) return { positions: [0], containerWidth }

  const naturalWidth = count * cardWidth + (count - 1) * gap
  if (naturalWidth <= containerWidth || containerWidth === 0) {
    const positions = Array.from({ length: count }, (_, i) => i * (cardWidth + gap))
    return { positions, containerWidth }
  }
  const spacing = (containerWidth - cardWidth) / (count - 1)
  const positions = Array.from({ length: count }, (_, i) => i * spacing)
  return { positions, containerWidth }
}
