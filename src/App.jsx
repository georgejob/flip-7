import { useCallback, useState } from 'react'
import { Lobby } from './components/lobby/Lobby'
import { WaitingRoom } from './components/lobby/WaitingRoom'
import { GameScreen } from './components/game/GameScreen'

export default function App() {
  const [screen, setScreen] = useState('lobby')
  const [session, setSession] = useState(null)

  const handleEnterRoom = useCallback(({ roomId, code, playerName, isHost }) => {
    setSession({ roomId, code, playerName, isHost })
    setScreen('waiting')
  }, [])

  const handleStart = useCallback(() => {
    setScreen('game')
  }, [])

  const handleLeave = useCallback(() => {
    setSession(null)
    setScreen('lobby')
  }, [])

  if (screen === 'waiting' && session) {
    return (
      <WaitingRoom
        roomId={session.roomId}
        roomCode={session.code}
        isHost={session.isHost}
        onStart={handleStart}
        onLeave={handleLeave}
      />
    )
  }

  if (screen === 'game' && session) {
    return <GameScreen roomCode={session.code} onLeave={handleLeave} />
  }

  return <Lobby onEnterRoom={handleEnterRoom} />
}
