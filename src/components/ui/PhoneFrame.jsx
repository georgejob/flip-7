import { Backdrop } from './Backdrop'

export function PhoneFrame({ children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#E0F2FE',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 400,
          minHeight: 720,
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
            padding: '28px 24px 32px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 720,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
