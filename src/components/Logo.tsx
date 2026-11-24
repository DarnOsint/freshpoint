import { Link } from 'react-router-dom'

export function Logo({ light = false, label = 'FreshPoint' }: { light?: boolean; label?: string }) {
  return (
    <Link to="/" className={`logo${light ? ' logo--light' : ''}`} aria-label={`${label} home`}>
      <span className="logo__image">
        <img src={light ? '/logo-light.png' : '/logo.png'} alt={label} />
      </span>
    </Link>
  )
}
