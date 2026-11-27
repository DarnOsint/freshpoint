import { Link } from 'react-router-dom'
import { imageUrl } from '../lib/assets'
import { useSiteSettings } from '../lib/site-content'

export function Logo({ light = false, label = 'FreshPoint' }: { light?: boolean; label?: string }) {
  const { settings } = useSiteSettings()
  const key = light ? settings.brand.logoLightKey : settings.brand.logoKey
  const fallback = light ? '/logo-light.png' : '/logo.png'

  return (
    <Link to="/" className={`logo${light ? ' logo--light' : ''}`} aria-label={`${label} home`}>
      <span className="logo__image">
        <img src={imageUrl(key, fallback)} alt={label} />
      </span>
    </Link>
  )
}
