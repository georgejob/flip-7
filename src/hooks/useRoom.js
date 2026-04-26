import { useEffect, useState } from 'react'
import { getGameState, subscribeToRoom } from '../game/supabase'

export function useRoom(roomId) {
  const [room, setRoom] = useState(null)

  useEffect(() => {
    if (!roomId) return
    let cancelled = false

    getGameState(roomId).then(({ room }) => {
      if (!cancelled) setRoom(room)
    }).catch((err) => {
      console.error('useRoom: failed to fetch room', err)
    })

    const unsubscribe = subscribeToRoom(roomId, {
      onRoomChange: (payload) => {
        if (payload.eventType === 'DELETE') {
          setRoom(null)
        } else if (payload.new) {
          setRoom(payload.new)
        }
      },
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [roomId])

  return { room }
}
