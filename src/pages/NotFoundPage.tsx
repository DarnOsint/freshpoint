import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export function NotFoundPage() {
  return (
    <section className="container simple-page">
      <div className="simple-page__card">
        <p className="eyebrow">404</p>
        <h1>This page went stale</h1>
        <p>We couldn’t find what you were looking for. Let’s get you back to fresh produce.</p>
        <div className="simple-page__actions">
          <Link to="/" className="btn btn--primary">Back home <ArrowRight size={17} /></Link>
        </div>
      </div>
    </section>
  )
}
