import { useEffect, useState } from 'react'
import { getGameState, subscribeToRoom } from '../game/supabase'

export function useRoomSession(roomId) {
  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!roomId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)

    getGameState(roomId)
      .then(({ room, players }) => {
        if (cancelled) return
        setRoom(room)
        setPlayers(players ?? [])
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('useRoomSession: failed to fetch state', err)
        setError(err?.message ?? 'Could not load room')
        setLoading(false)
      })

    const unsubscribe = subscribeToRoom(roomId, {
      onRoomChange: (payload) => {
        if (payload.eventType === 'DELETE') {
          setRoom(null)
        } else if (payload.new) {
          setRoom(payload.new)
        }
      },
      onPlayersChange: (payload) => {
        setPlayers((current) => {
          if (payload.eventType === 'INSERT') {
            if (current.some((p) => p.id === payload.new.id)) return current
            return [...current, payload.new].sort((a, b) => a.seat - b.seat)
          }
          if (payload.eventType === 'UPDATE') {
            return current
              .map((p) => (p.id === payload.new.id ? payload.new : p))
              .sort((a, b) => a.seat - b.seat)
          }
          if (payload.eventType === 'DELETE') {
            return current.filter((p) => p.id !== payload.old.id)
          }
          return current
        })
      },
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [roomId])

  return { room, players, loading, error }
}
