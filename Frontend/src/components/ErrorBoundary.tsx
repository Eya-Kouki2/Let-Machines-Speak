import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            maxWidth: '720px',
            margin: '48px auto',
            padding: '32px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(5, 46, 31, 0.08)',
            border: '1px solid #d4e8d8',
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                fontSize: '20px',
                fontWeight: 'bold',
              }}
            >
              ⚠
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#052e1f' }}>
                {this.props.fallbackTitle ?? 'Something went wrong rendering this view'}
              </h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                An unexpected error occurred. You can retry or return to the overview.
              </p>
            </div>
          </div>

          {this.state.error && (
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                fontSize: '0.85rem',
                color: '#b91c1c',
                fontFamily: 'monospace',
                overflowX: 'auto',
              }}
            >
              {this.state.error.name}: {this.state.error.message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                padding: '10px 20px',
                backgroundColor: '#145338',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                padding: '10px 20px',
                backgroundColor: '#eef7f1',
                color: '#145338',
                border: '1px solid #d4e8d8',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#home'
                this.handleReset()
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                color: '#64748b',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Go to Home
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
