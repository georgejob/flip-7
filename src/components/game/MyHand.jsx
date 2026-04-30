import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from './Card'
import { CardBack } from './CardBack'
import { useDynamicHandLayout } from '../../hooks/useAdaptiveLayout'
import { calcRoundScore } from '../../game/engine'

const labelStyle = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 900,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: '#0284C7',
}

const FLIGHT_DURATION = 0.42 // seconds
const FLIP_DELAY = 0.21 // seconds — flip starts at midpoint
const FLIP_DURATION = 0.21 // seconds
const BOUNCE_MS = 320

// A face-down → face-up card that arcs from the deck position into its
// landing slot in the hand. Rendered into document.body via portal so it
// flies above any clipping ancestors.
function FlyingCard({ from, to, card, width, height, onComplete }) {
  return (
    <motion.div
      initial={{ x: from.x, y: from.y, opacity: 1 }}
      animate={{ x: to.x, y: to.y }}
      transition={{
        duration: FLIGHT_DURATION,
        x: { ease: [0.25, 0.46, 0.45, 0.94] },
        y: { ease: [0.55, 0.05, 0.7, 0.95] },
      }}
      onAnimationComplete={onComplete}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents: 'none',
        zIndex: 9999,
        perspective: 600,
      }}
    >
      <motion.div
        initial={{ rotateY: 0 }}
        animate={{ rotateY: 180 }}
        transition={{ delay: FLIP_DELAY, duration: FLIP_DURATION, ease: 'linear' }}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <CardBack width={width} height={height} />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <Card card={card} width={width} height={height} />
        </div>
      </motion.div>
    </motion.div>
  )
}

export function MyHand({
  player,
  bustedSnapshot,
  flip7Snapshot,
  frozenSnapshot,
  freezeFlashKey = 0,
  shakeKey = 0,
  round,
  phase = 'play',
  isMyTurn,
  isWaitingForOther,
  waitingForName,
  hasPendingAction,
  newestCardKey,
  localDrawAt = 0,
  localDrawnCard = null,
  onDrawAnimated,
  onHit,
  onStay,
  pending,
}) {
  const isDealing = phase === 'initialDeal'
  const cardsRef = useRef(null)
  const modifiersRef = useRef(null)
  const isBusted = player?.status === 'busted'
  const isFlip7 = !!flip7Snapshot
  const isFrozen = player?.status === 'frozen'

  const display = isBusted && bustedSnapshot
    ? bustedSnapshot
    : isFlip7
      ? flip7Snapshot
      : isFrozen && frozenSnapshot
        ? { ...frozenSnapshot, bustingIndex: -1 }
        : { numbers: player?.numbers ?? [], modifiers: player?.modifiers ?? [], secondChance: player?.secondChance ?? null, bustingIndex: -1 }
  const numbers = display.numbers
  const modifiers = display.modifiers
  const secondChance = display.secondChance
  const bustingIndex = display.bustingIndex ?? -1
  const totalCards = numbers.length

  const { positions, cardWidth, cardHeight } = useDynamicHandLayout(cardsRef, totalCards)

  const score = player && !isBusted ? calcRoundScore(player) : 0
  const canStay = numbers.length + modifiers.length > 0

  // Flying-card animation state. The flight is fully owned by MyHand: we
  // detect new draws via `localDrawAt`, render a portal-mounted clone that
  // travels from the deck count to the card's landing slot, hide the real
  // card while the clone is in flight, then drop the clone and let the real
  // card spring into place.
  const lastProcessedDrawAtRef = useRef(localDrawAt)
  const prevDisplayRef = useRef({
    numbers: numbers.length,
    modifiers: modifiers.length,
    secondChance: !!secondChance,
  })
  const [flying, setFlying] = useState(null)
  const [hideKey, setHideKey] = useState(null)
  const [bounceKey, setBounceKey] = useState(null)

  useLayoutEffect(() => {
    if (localDrawAt && localDrawAt !== lastProcessedDrawAtRef.current) {
      lastProcessedDrawAtRef.current = localDrawAt
      const cur = {
        numbers: numbers.length,
        modifiers: modifiers.length,
        secondChance: !!secondChance,
      }
      const prev = prevDisplayRef.current

      let target = null
      if (cur.numbers > prev.numbers && cur.numbers > 0) {
        const idx = cur.numbers - 1
        target = { type: 'number', key: `n-${idx}-${numbers[idx].value}`, index: idx }
      } else if (cur.modifiers > prev.modifiers && cur.modifiers > 0) {
        const idx = cur.modifiers - 1
        target = { type: 'modifier', key: `mod-${idx}`, index: idx }
      } else if (cur.secondChance && !prev.secondChance) {
        target = { type: 'second', key: 'second-chance', slot: cur.modifiers }
      }

      const fail = () => onDrawAnimated?.(localDrawAt)

      if (!target || flying) {
        fail()
      } else {
        const deckEl = document.querySelector('[data-deck-count]')
        if (!deckEl) {
          fail()
        } else {
          const deckRect = deckEl.getBoundingClientRect()
          let toX = null
          let toY = null
          if (target.type === 'number') {
            const rect = cardsRef.current?.getBoundingClientRect()
            if (rect) {
              toX = rect.left + (positions[target.index] ?? 0)
              toY = rect.top + 4
            }
          } else {
            const rect = modifiersRef.current?.getBoundingClientRect()
            if (rect) {
              const slot = target.type === 'modifier' ? target.index : target.slot
              toX = rect.left + slot * (cardWidth + 6)
              toY = rect.top
            }
          }
          if (toX == null || toY == null) {
            fail()
          } else {
            setFlying({
              from: {
                x: deckRect.left + (deckRect.width - cardWidth) / 2,
                y: deckRect.top + (deckRect.height - cardHeight) / 2,
              },
              to: { x: toX, y: toY },
              card: localDrawnCard,
              width: cardWidth,
              height: cardHeight,
              at: localDrawAt,
              landKey: target.key,
            })
            setHideKey(target.key)
          }
        }
      }
    }
    prevDisplayRef.current = {
      numbers: numbers.length,
      modifiers: modifiers.length,
      secondChance: !!secondChance,
    }
  }, [
    localDrawAt,
    localDrawnCard,
    numbers,
    modifiers,
    secondChance,
    positions,
    cardWidth,
    cardHeight,
    onDrawAnimated,
    flying,
  ])

  const handleFlightComplete = () => {
    if (!flying) return
    const { at, landKey } = flying
    setFlying(null)
    setHideKey(null)
    setBounceKey(landKey)
    onDrawAnimated?.(at)
  }

  useEffect(() => {
    if (!bounceKey) return
    const t = setTimeout(() => setBounceKey(null), BOUNCE_MS)
    return () => clearTimeout(t)
  }, [bounceKey])

  // Disable Hit while a card is in flight so a second press can't fire a
  // parallel animation.
  const isAnimating = !!flying
  const canAct = isMyTurn && !hasPendingAction && !isDealing && player?.status === 'active' && !isAnimating

  // Blue glow flash on the container when freeze lands.
  const [freezeGlow, setFreezeGlow] = useState(false)
  useEffect(() => {
    if (!freezeFlashKey) return
    setFreezeGlow(true)
    const t = setTimeout(() => setFreezeGlow(false), 500)
    return () => clearTimeout(t)
  }, [freezeFlashKey])

  // Red-flash + shake on the cards row when shakeKey bumps.
  const [flash, setFlash] = useState(false)
  useEffect(() => {
    if (!shakeKey) return
    setFlash(true)
    const t = setTimeout(() => setFlash(false), 500)
    return () => clearTimeout(t)
  }, [shakeKey])

  const containerBorder = isBusted
    ? '2.5px solid #FECACA'
    : isFlip7
      ? '2.5px solid #FCD34D'
      : isFrozen
        ? '2.5px solid #BFDBFE'
        : '2.5px solid #7DD3FC'
  const containerBg = isBusted
    ? '#FFF5F5'
    : isFlip7
      ? '#FFFBEB'
      : isFrozen
        ? '#EFF6FF'
        : 'white'

  const flip7ContainerAnimate = isFlip7
    ? {
        x: 0,
        boxShadow: [
          '0 0 0 0 rgba(252, 211, 77, 0)',
          '0 0 0 4px #FCD34D, 0 0 24px rgba(252, 211, 77, 0.4)',
          '0 0 0 0 rgba(252, 211, 77, 0)',
          '0 0 0 4px #FCD34D, 0 0 24px rgba(252, 211, 77, 0.4)',
          '0 0 0 0 rgba(252, 211, 77, 0)',
        ],
      }
    : null

  const freezeContainerAnimate = freezeGlow
    ? {
        x: 0,
        boxShadow: [
          '0 0 0 0 rgba(147, 197, 253, 0)',
          '0 0 0 4px #BFDBFE, 0 0 20px rgba(147, 197, 253, 0.4)',
          '0 0 0 0 rgba(147, 197, 253, 0)',
        ],
      }
    : null

  const containerAnimate = flip7ContainerAnimate
    ? flip7ContainerAnimate
    : freezeContainerAnimate
      ? freezeContainerAnimate
      : shakeKey
        ? { x: [0, -8, 8, -5, 5, 0] }
        : { x: 0 }
  const containerTransition = flip7ContainerAnimate
    ? { duration: 0.6 }
    : freezeContainerAnimate
      ? { duration: 0.5 }
      : { duration: 0.4 }

  return (
    <motion.div
      animate={containerAnimate}
      transition={containerTransition}
      style={{
        background: containerBg,
        border: containerBorder,
        borderRadius: 16,
        padding: 10,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minHeight: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span
          style={{
            ...labelStyle,
            color: isBusted
              ? '#7F1D1D'
              : isFlip7
                ? '#92400E'
                : isFrozen
                  ? '#1D4ED8'
                  : labelStyle.color,
          }}
        >
          Your hand ·{' '}
          {isBusted
            ? 'busted'
            : isFlip7
              ? '🎉 flip 7!'
              : isFrozen
                ? 'frozen'
                : `${totalCards} cards`}
        </span>
        <span
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: 12,
            color: isBusted ? '#7F1D1D' : '#082F49',
          }}
        >
          {isBusted ? (
            <span style={{ color: '#DC2626', fontSize: 14 }}>0 pts</span>
          ) : isFrozen ? (
            <span style={{ color: '#0EA5E9', fontSize: 14 }}>
              🔒 {frozenSnapshot ? calcRoundScore(frozenSnapshot) : 0} pts
            </span>
          ) : (
            <>
              round:{' '}
              <span style={{ color: '#0EA5E9', fontSize: 17 }}>{round}</span>
            </>
          )}
        </span>
      </div>

      {(modifiers.length > 0 || secondChance) && (
        <div
          ref={modifiersRef}
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            opacity: isBusted ? 0.5 : 1,
          }}
        >
          {modifiers.map((m, i) => {
            const key = `mod-${i}`
            const isHidden = key === hideKey
            const isBouncing = key === bounceKey
            return (
              <motion.div
                key={key}
                initial={false}
                animate={
                  isHidden
                    ? { opacity: 0, scale: 1, y: 0 }
                    : isBouncing
                      ? { opacity: 1, scale: [1.08, 1], y: [-6, 0] }
                      : { opacity: 1, scale: 1, y: 0 }
                }
                transition={
                  isBouncing
                    ? { duration: 0.32, ease: [0.34, 1.16, 0.64, 1] }
                    : { duration: 0.12 }
                }
                style={{ lineHeight: 0 }}
              >
                <Card card={m} width={cardWidth} height={cardHeight} />
              </motion.div>
            )
          })}
          {secondChance && (() => {
            const key = 'second-chance'
            const isHidden = key === hideKey
            const isBouncing = key === bounceKey
            return (
              <motion.div
                key={key}
                initial={false}
                animate={
                  isHidden
                    ? { opacity: 0, scale: 1, y: 0 }
                    : isBouncing
                      ? { opacity: 1, scale: [1.08, 1], y: [-6, 0] }
                      : { opacity: 1, scale: 1, y: 0 }
                }
                transition={
                  isBouncing
                    ? { duration: 0.32, ease: [0.34, 1.16, 0.64, 1] }
                    : { duration: 0.12 }
                }
                style={{ lineHeight: 0 }}
              >
                <Card card={secondChance} width={cardWidth} height={cardHeight} />
              </motion.div>
            )
          })()}
        </div>
      )}

      <div
        ref={cardsRef}
        style={{
          position: 'relative',
          flex: 1,
          minHeight: cardHeight + 8,
          width: '100%',
          minWidth: 0,
          zIndex: 0,
        }}
      >
        <AnimatePresence>
          {numbers.map((c, i) => {
            const key = `n-${i}-${c.value}`
            const isBusting = isBusted && i === bustingIndex
            const isNewest = !isBusted && key === newestCardKey
            const glow = isBusting ? 'red' : isNewest
            const z = isBusting ? 200 : isNewest ? 100 : i
            const cardOpacity = isBusted && !isBusting ? 0.5 : 1
            const isHidden = key === hideKey
            const isBouncing = key === bounceKey

            let initialProps
            let animateProps
            let transitionProps
            if (isHidden) {
              // The flying card is in flight; keep this slot invisible so
              // there's no flash of the real card behind the clone.
              initialProps = { opacity: 0 }
              animateProps = { opacity: 0 }
              transitionProps = { duration: 0 }
            } else if (isBouncing) {
              // Card just landed — overshoot then settle. Keyframe arrays let
              // framer animate scale 1.08→1 and y -6→0 even though the slot
              // was already mounted (with opacity:0) during the flight.
              initialProps = false
              animateProps = {
                scale: [1.08, 1],
                y: [-6, 0],
                opacity: cardOpacity,
                x: 0,
                filter: 'none',
              }
              transitionProps = { duration: 0.32, ease: [0.34, 1.16, 0.64, 1] }
            } else if (isFlip7) {
              initialProps = { x: 10, y: 20, opacity: 0 }
              animateProps = { x: 0, y: [0, -4, 0], opacity: 1, filter: 'none' }
              transitionProps = { delay: i * 0.08, duration: 0.5, y: { times: [0, 0.5, 1] } }
            } else if (flash) {
              initialProps = { x: 10, y: 20, opacity: 0 }
              animateProps = { x: 0, y: 0, opacity: cardOpacity, filter: 'sepia(1) hue-rotate(-50deg) saturate(4)' }
              transitionProps = { type: 'spring', stiffness: 280, damping: 22 }
            } else {
              initialProps = { x: 10, y: 20, opacity: 0 }
              animateProps = { x: 0, y: 0, opacity: cardOpacity, filter: 'none' }
              transitionProps = { type: 'spring', stiffness: 280, damping: 22 }
            }

            return (
              <motion.div
                key={key}
                layout
                initial={initialProps}
                animate={animateProps}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={transitionProps}
                style={{
                  position: 'absolute',
                  left: positions[i] ?? 0,
                  top: 4,
                  width: cardWidth,
                  height: cardHeight,
                  zIndex: z,
                }}
              >
                <Card card={c} glow={glow} width={cardWidth} height={cardHeight} />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
        {isBusted ? (
          <div
            style={{
              flex: 1,
              background: '#FEE2E2',
              border: '2px solid #FCA5A5',
              boxShadow: '0 4px 0 #FCA5A5',
              borderRadius: 12,
              padding: '9px',
              textAlign: 'center',
              color: '#7F1D1D',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            💥 You busted this round
          </div>
        ) : isFrozen ? (
          <div
            style={{
              flex: 1,
              background: '#EFF6FF',
              border: '2px solid #BFDBFE',
              boxShadow: '0 4px 0 #BFDBFE',
              borderRadius: 12,
              padding: '9px',
              textAlign: 'center',
              color: '#1E3A8A',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            🧊 You're frozen — points banked
          </div>
        ) : isFlip7 ? (
          <div
            style={{
              flex: 1,
              background: '#FEF3C7',
              border: '2px solid #FCD34D',
              boxShadow: '0 4px 0 #FCD34D',
              borderRadius: 12,
              padding: '9px',
              textAlign: 'center',
              color: '#92400E',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            🎉 You flipped 7!
          </div>
        ) : isDealing ? (
          <div
            style={{
              flex: 1,
              border: '2px dashed #BAE6FD',
              background: '#F0F9FF',
              borderRadius: 12,
              padding: '9px',
              textAlign: 'center',
              color: '#0EA5E9',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            🃏 dealing initial cards…
          </div>
        ) : isWaitingForOther ? (
          <div
            style={{
              flex: 1,
              border: '2px dashed #BAE6FD',
              background: '#F0F9FF',
              borderRadius: 12,
              padding: '9px',
              textAlign: 'center',
              color: '#BAE6FD',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: 12,
            }}
          >
            ⏳ waiting for {waitingForName ?? 'next player'}…
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onHit}
              disabled={!canAct || pending}
              style={{
                flex: 1,
                background: canAct ? '#0EA5E9' : '#E0F2FE',
                border: canAct ? '3px solid #0369A1' : '3px solid #BAE6FD',
                boxShadow: canAct ? '0 4px 0 #0369A1' : '0 4px 0 #BAE6FD',
                color: canAct ? 'white' : '#7DD3FC',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 900,
                fontSize: 15,
                padding: '9px',
                borderRadius: 12,
                cursor: canAct && !pending ? 'pointer' : 'not-allowed',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Hit
            </button>
            <button
              type="button"
              onClick={onStay}
              disabled={!canAct || !canStay || pending}
              style={{
                flex: 1,
                background: canAct && canStay ? '#A7F3D0' : '#E0F2FE',
                border: canAct && canStay ? '3px solid #34D399' : '3px solid #BAE6FD',
                boxShadow: canAct && canStay ? '0 4px 0 #34D399' : '0 4px 0 #BAE6FD',
                color: canAct && canStay ? '#064E3B' : '#7DD3FC',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 900,
                fontSize: 15,
                padding: '9px',
                borderRadius: 12,
                cursor: canAct && canStay && !pending ? 'pointer' : 'not-allowed',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Stay ({score} pts)
            </button>
          </>
        )}
      </div>
      {flying && typeof document !== 'undefined' &&
        createPortal(
          <FlyingCard
            from={flying.from}
            to={flying.to}
            card={flying.card}
            width={flying.width}
            height={flying.height}
            onComplete={handleFlightComplete}
          />,
          document.body,
        )}
    </motion.div>
  )
}
