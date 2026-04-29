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

// Card aspect ratio (width / height) used by the local player's hand.
// Matches the existing fixed dimensions: 38 / 54.
export const HAND_CARD_RATIO = 38 / 54
const MIN_CARD_WIDTH = 28
export const MAX_CARD_WIDTH = 80
const HAND_GAP = 6

// Detail levels keyed off cardWidth. Components render different internals
// per level so cards stay legible as they shrink.
export function getCardDetailLevel(cardWidth) {
  if (cardWidth >= 60) return 'full'
  if (cardWidth >= 44) return 'medium'
  if (cardWidth >= 32) return 'compact'
  return 'minimal'
}

// Measures both width and height of the card container and returns dynamic
// card dimensions plus per-card x positions. Cards always fill the container
// in both axes — when the natural side-by-side width fits they're spaced by
// HAND_GAP; otherwise they overlap so the last card's right edge is flush
// with the container's right edge.
export function useDynamicHandLayout(ref, count) {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect?.width ?? el.clientWidth
        const h = entry.contentRect?.height ?? el.clientHeight
        setSize({ width: w, height: h })
      }
    })
    ro.observe(el)
    setSize({ width: el.clientWidth, height: el.clientHeight })
    return () => ro.disconnect()
  }, [ref])

  const { width: containerWidth, height: containerHeight } = size

  if (count <= 0) {
    const cardHeight = MAX_CARD_WIDTH / HAND_CARD_RATIO
    return {
      cardWidth: MAX_CARD_WIDTH,
      cardHeight,
      positions: [],
      detailLevel: 'full',
      containerWidth,
      containerHeight,
    }
  }

  // Height-first sizing: card height fills container height (minus a little
  // breathing room), capped by the max width's implied height. Width follows
  // from the fixed aspect ratio.
  const maxCardHeight = MAX_CARD_WIDTH / HAND_CARD_RATIO
  const heightCap = containerHeight > 0
    ? Math.min(containerHeight - 8, maxCardHeight)
    : maxCardHeight
  let cardHeight = Math.max(MIN_CARD_WIDTH / HAND_CARD_RATIO, heightCap)
  let cardWidth = Math.round(cardHeight * HAND_CARD_RATIO)

  // Floor so even a wide single card fits the container.
  if (containerWidth > 0 && cardWidth > containerWidth) {
    cardWidth = containerWidth
    cardHeight = Math.round(cardWidth / HAND_CARD_RATIO)
  }
  if (cardWidth < MIN_CARD_WIDTH) {
    cardWidth = MIN_CARD_WIDTH
    cardHeight = Math.round(cardWidth / HAND_CARD_RATIO)
  }

  const positions = []
  if (containerWidth <= 0) {
    for (let i = 0; i < count; i++) positions.push(i * (cardWidth + HAND_GAP))
  } else if (count === 1) {
    positions.push(0)
  } else {
    const naturalTotal = count * cardWidth + (count - 1) * HAND_GAP
    if (naturalTotal <= containerWidth) {
      for (let i = 0; i < count; i++) positions.push(i * (cardWidth + HAND_GAP))
    } else {
      const spacing = (containerWidth - cardWidth) / (count - 1)
      for (let i = 0; i < count; i++) positions.push(Math.round(i * spacing))
    }
  }

  return {
    cardWidth,
    cardHeight,
    positions,
    detailLevel: getCardDetailLevel(cardWidth),
    containerWidth,
    containerHeight,
  }
}
