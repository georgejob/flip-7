import { useCallback, useState } from 'react'
import { Lobby } from './components/lobby/Lobby'
import { WaitingRoom } from './components/lobby/WaitingRoom'
import { GameScreen } from './components/game/GameScreen'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

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

  let content
  if (screen === 'waiting' && session) {
    content = (
      <WaitingRoom
        roomId={session.roomId}
        roomCode={session.code}
        isHost={session.isHost}
        onStart={handleStart}
        onLeave={handleLeave}
      />
    )
  } else if (screen === 'game' && session) {
    content = <GameScreen roomCode={session.code} onLeave={handleLeave} />
  } else {
    content = <Lobby onEnterRoom={handleEnterRoom} />
  }

  return <ErrorBoundary>{content}</ErrorBoundary>
}
