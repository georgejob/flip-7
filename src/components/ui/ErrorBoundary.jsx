import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    const message = this.state.error?.message ?? String(this.state.error)
    return (
      <div
        style={{
          minHeight: '100vh',
          padding: 32,
          background: '#FEF2F2',
          color: '#7F1D1D',
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 800,
        }}
      >
        <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 28, color: '#7F1D1D', marginTop: 0 }}>
          Something broke
        </h1>
        <pre
          style={{
            background: 'white',
            border: '2px solid #FCA5A5',
            borderRadius: 12,
            padding: 12,
            color: '#7F1D1D',
            fontSize: 13,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {message}
        </pre>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          style={{
            marginTop: 16,
            background: '#0EA5E9',
            border: '3px solid #0369A1',
            boxShadow: '0 5px 0 #0369A1',
            color: 'white',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: 14,
            padding: '10px 16px',
            borderRadius: 12,
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </div>
    )
  }
}
