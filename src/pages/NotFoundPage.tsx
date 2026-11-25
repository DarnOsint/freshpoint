import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useSiteSettings } from '../lib/site-content'

export function NotFoundPage() {
  const { settings } = useSiteSettings()
  const copy = settings.interface.notFound

  return (
    <section className="container simple-page">
      <div className="simple-page__card">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.heading}</h1>
        <p>{copy.body}</p>
        <div className="simple-page__actions">
          <Link to="/" className="btn btn--primary">{copy.cta} <ArrowRight size={17} /></Link>
        </div>
      </div>
    </section>
  )
}
