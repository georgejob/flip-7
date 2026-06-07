import { useEffect, useState } from 'react'

const STORAGE_KEY = 'flip7-ui-muted'

let audioCtx = null
let muted = false
try {
  muted = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1'
} catch {
  muted = false
}
const listeners = new Set()

const PROFILES = {
  hit: { startHz: 1000, endHz: 500, decay: 0.08, gain: 0.16 },
  stay: { startHz: 600, endHz: 300, decay: 0.1, gain: 0.14 },
  primary: { startHz: 800, endHz: 400, decay: 0.08, gain: 0.15 },
  small: { startHz: 700, endHz: 500, decay: 0.06, gain: 0.12 },
}

function getCtx() {
  if (audioCtx) return audioCtx
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  try {
    audioCtx = new Ctx()
    return audioCtx
  } catch {
    return null
  }
}

export function playClickSound(profile = 'primary') {
  if (muted) return
  const p = PROFILES[profile] ?? PROFILES.primary
  try {
    const ctx = getCtx()
    if (!ctx) return
    if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      ctx.resume().catch(() => {})
    }
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(p.startHz, t)
    osc.frequency.exponentialRampToValueAtTime(Math.max(p.endHz, 1), t + p.decay)
    gain.gain.setValueAtTime(p.gain, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + p.decay + 0.02)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + p.decay + 0.05)
  } catch {
    // no-op
  }
}

export function setUiMuted(next) {
  muted = !!next
  try {
    localStorage.setItem(STORAGE_KEY, muted ? '1' : '0')
  } catch {
    // no-op
  }
  listeners.forEach((fn) => fn(muted))
}

export function getUiMuted() {
  return muted
}

export function useUiMuted() {
  const [m, setM] = useState(muted)
  useEffect(() => {
    const fn = (v) => setM(v)
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  }, [])
  return [m, setUiMuted]
}
