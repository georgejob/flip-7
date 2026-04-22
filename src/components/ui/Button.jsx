export function Button({ children, onClick, disabled, variant = 'primary' }) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}
