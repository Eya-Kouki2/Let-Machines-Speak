import { useEffect } from 'react'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  open: boolean
  title: string
  message?: string
  variant?: ToastVariant
  onClose?: () => void
}

export function Toast({ open, title, message, variant = 'info', onClose }: ToastProps) {
  useEffect(() => {
    if (!open) return
    const timeout = window.setTimeout(() => {
      onClose?.()
    }, 3200)
    return () => window.clearTimeout(timeout)
  }, [onClose, open])

  if (!open) return null

  return (
    <div className={`labes-toast labes-toast-${variant}`} role="status" aria-live="polite">
      <div className="labes-toast-icon">{variant === 'success' ? '✓' : variant === 'error' ? '!' : variant === 'warning' ? '⚠' : 'i'}</div>
      <div className="labes-toast-copy">
        <strong>{title}</strong>
        {message && <span>{message}</span>}
      </div>
      {onClose && <button type="button" className="labes-toast-close" onClick={onClose}>×</button>}
    </div>
  )
}
