import { PressableButton } from '../ui/PressableButton'

const KIND_LABEL = {
  freeze: { title: 'Freeze a player', sub: 'They bank their points and sit out the round.' },
  flipThree: { title: 'Flip Three', sub: 'Choose a player to draw 3 cards.' },
  reassignSecondChance: {
    title: 'Reassign Second Chance',
    sub: 'You already have one. Pick another player to give it to.',
  },
}

export function TargetPickerModal({ action, targets, onPick, onCancel }) {
  const meta = KIND_LABEL[action.kind] ?? { title: 'Choose a target', sub: '' }
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(8, 47, 73, 0.6)',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 'inherit',
      }}
    >
      <div
        style={{
          background: 'white',
          border: '3px solid #7DD3FC',
          borderRadius: 18,
          padding: 16,
          width: '100%',
          maxWidth: 320,
        }}
      >
        <h3
          style={{
            fontFamily: "'Fredoka One', cursive",
            color: '#082F49',
            fontSize: 20,
            margin: '0 0 4px',
          }}
        >
          {meta.title}
        </h3>
        <p
          style={{
            color: '#0284C7',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 800,
            fontSize: 12,
            margin: '0 0 12px',
          }}
        >
          {meta.sub}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {targets.length === 0 && (
            <div
              style={{
                color: '#7DD3FC',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 900,
                fontSize: 12,
                textAlign: 'center',
                padding: 12,
              }}
            >
              No valid targets — discarding card.
            </div>
          )}
          {targets.map((t) => (
            <PressableButton
              key={t.id}
              onClick={() => onPick(t.id)}
              shadowDepth={3}
              shadowColor="#0369A1"
              pressScale={0.97}
              ripple
              rippleColor="rgba(255,255,255,0.25)"
              soundProfile="primary"
              style={{
                background: '#0EA5E9',
                border: '2.5px solid #0369A1',
                color: 'white',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 900,
                fontSize: 14,
                padding: '10px 14px',
                borderRadius: 12,
                justifyContent: 'flex-start',
                textAlign: 'left',
              }}
            >
              {t.name}
            </PressableButton>
          ))}
        </div>
        <PressableButton
          onClick={onCancel}
          shadowDepth={2}
          shadowColor="#BAE6FD"
          pressScale={0.97}
          soundProfile="small"
          style={{
            marginTop: 12,
            width: '100%',
            background: '#E0F2FE',
            border: '2px solid #BAE6FD',
            color: '#0284C7',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: 12,
            padding: '8px',
            borderRadius: 10,
            textTransform: 'uppercase',
          }}
        >
          {targets.length === 0 ? 'Discard & continue' : 'Cancel (discard card)'}
        </PressableButton>
      </div>
    </div>
  )
}
