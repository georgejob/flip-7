import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useRoom(roomId) {
  const [room, setRoom] = useState(null)

  // TODO: subscribe to room state via Supabase Realtime

  return { room }
}
