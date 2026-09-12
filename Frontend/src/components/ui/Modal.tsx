import { useEffect, useRef, type ReactNode } from 'react'

export type ModalVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  icon?: string
  variant?: ModalVariant
  confirmText?: string
  cancelText?: string
  loading?: boolean
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  children?: ReactNode
}

export function Modal({
  open,
  title,
  description,
  icon,
  variant = 'default',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel?.()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel, open])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!open) return null

  return (
    <div className="labes-modal-backdrop" onClick={onCancel}>
      <div
        ref={dialogRef}
        className={`labes-modal labes-modal-${variant}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="labes-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="labes-modal-header">
          {icon && <div className="labes-modal-icon">{icon}</div>}
          <div>
            <h3 id="labes-modal-title">{title}</h3>
            {description && <p>{description}</p>}
          </div>
        </div>

        {children && <div className="labes-modal-body">{children}</div>}

        {(onConfirm || onCancel) && (
          <div className="labes-modal-actions">
            {onCancel && (
              <button type="button" className="labes-btn labes-btn-secondary" onClick={onCancel}>
                {cancelText}
              </button>
            )}
            {onConfirm && (
              <button type="button" className={`labes-btn labes-btn-${variant}`} onClick={onConfirm} disabled={loading}>
                {loading ? 'Please wait...' : confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
