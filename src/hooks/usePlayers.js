import { useEffect, useState } from 'react'
import { getGameState, subscribeToRoom } from '../game/supabase'

export function usePlayers(roomId) {
  const [players, setPlayers] = useState([])

  useEffect(() => {
    if (!roomId) return
    let cancelled = false

    getGameState(roomId).then(({ players }) => {
      if (!cancelled) setPlayers(players ?? [])
    }).catch((err) => {
      console.error('usePlayers: failed to fetch players', err)
    })

    const unsubscribe = subscribeToRoom(roomId, {
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

  return { players }
}
