import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function usePlayers(roomId) {
  const [players, setPlayers] = useState([])

  // TODO: subscribe to player list via Supabase Realtime

  return { players }
}
