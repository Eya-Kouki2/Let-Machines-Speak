import labesLogo from '../assets/logo.png'

interface LabesLogoProps {
  className?: string
}

export function LabesLogo({ className = '' }: LabesLogoProps) {
  return (
    <span className={`labes-logo-lockup ${className}`.trim()}>
      <img src={labesLogo} alt="LABES logo" className="labes-logo-image" />
    </span>
  )
}
