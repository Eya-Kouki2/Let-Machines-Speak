import type { User } from '../../types/admin'

interface PendingApprovalProps {
  user: User | null
  onLogout: () => void
}

export function PendingApproval({ user, onLogout }: PendingApprovalProps) {
  const rejected = user?.approvalStatus === 'REJECTED'

  return (
    <div className="auth-page auth-page-centered">
      <div className="auth-form-card auth-state-card">
        <h1>{rejected ? 'Admin Request Rejected' : 'Admin Approval Pending'}</h1>
        <p>
          {rejected
            ? 'Your administrator request was rejected.'
            : 'Your administrator account request has been submitted and is waiting for approval .'}
        </p>
        <button type="button" className="btn-go-dashboard" onClick={onLogout}>Back to Sign In</button>
      </div>
    </div>
  )
}
