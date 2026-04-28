import { Backdrop } from './Backdrop'

export function PhoneFrame({ children }) {
  return (
    <div
      className="screen-container"
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: '#E0F2FE',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 400,
          height: '100%',
          maxHeight: 860,
          background: '#F0F9FF',
          border: '6px solid #7DD3FC',
          borderRadius: 40,
          boxShadow: '0 12px 30px rgba(2, 132, 199, 0.18)',
          overflow: 'hidden',
        }}
      >
        <Backdrop />
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '20px 20px 24px',
            paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflowY: 'auto',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
