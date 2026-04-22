export function Card({ value, faceDown = false }) {
  return (
    <div>
      {faceDown ? '?' : value}
    </div>
  )
}
