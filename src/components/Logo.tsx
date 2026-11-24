import { Link } from 'react-router-dom'

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className={`logo${light ? ' logo--light' : ''}`} aria-label="FreshPoint home">
      <span className="logo__image">
        <img src={light ? '/logo-light.png' : '/logo.png'} alt="FreshPoint" />
      </span>
    </Link>
  )
}
