import { useLayoutEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ProductImage } from '../components/ProductImage'
import { imageUrl } from '../lib/assets'
import { useData } from '../lib/data-store'
import { formatMoney } from '../lib/format'
import { useSiteSettings } from '../lib/site-content'

export function Home() {
  const { hash } = useLocation()
  const { products } = useData()
  const { settings } = useSiteSettings()
  const [heroPhotoLoaded, setHeroPhotoLoaded] = useState(false)
  const heroImage = imageUrl(settings.brand.heroPhotoKey, '/images/hero-market.jpg')
  const featured = products.filter((product) => product.active !== false).slice(0, 8)

  useLayoutEffect(() => {
    document.body.classList.add('home-view')
    return () => document.body.classList.remove('home-view')
  }, [])

  useLayoutEffect(() => {
    if (!hash) return
    const target = document.querySelector(hash)
    if (!(target instanceof HTMLElement) || target.offsetParent === null) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  return (
    <div className="home-page">
      <section className="hero" id="home">
        <h1 className="mobile-only-heading">{settings.brand.appName} — {settings.hero.title} {settings.hero.highlight}</h1>
        <p className="mobile-only-lead">{settings.hero.lead}</p>
        <div className="container hero__grid">
          <div className="hero__copy">
            <p className="eyebrow">{settings.hero.eyebrow}</p>
            <h1>{settings.hero.title} <span>{settings.hero.highlight}</span></h1>
            <p className="hero__lead">{settings.hero.lead}</p>
            <div className="hero__actions">
              <Link to="/signup" className="btn btn--primary btn--large">
                {settings.hero.primaryLabel}
              </Link>
              <Link to="/#categories" className="btn btn--outline btn--large">{settings.hero.secondaryLabel}</Link>
            </div>
            <ul className="hero__points">
              {settings.hero.points.map((point, index) => (
                <li key={`${point.text}-${index}`}>{point.text}</li>
              ))}
            </ul>
          </div>

          <div className="hero__visual">
            <div className="hero__photo">
              <img
                className={`hero__photo-img${heroPhotoLoaded ? ' hero__photo-img--loaded' : ''}`}
                src={heroImage}
                alt={settings.brand.heroPhotoAlt}
                onLoad={() => setHeroPhotoLoaded(true)}
                onError={() => setHeroPhotoLoaded(false)}
              />
            </div>
            <div className="hero__float hero__float--top">
              <div><strong>{settings.hero.floatTopTitle}</strong><small>{settings.hero.floatTopSubtitle}</small></div>
            </div>
            <div className="hero__float hero__float--bottom">
              <div><strong>{settings.hero.floatBottomTitle}</strong><small>{settings.hero.floatBottomSubtitle}</small></div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-strip">
        <div className="container stats-strip__grid">
          {settings.stats.items.map((stat, index) => (
            <div key={`${stat.value}-${index}`}><strong>{stat.value}</strong><span>{stat.label}</span></div>
          ))}
        </div>
      </section>

      <section className="section" id="categories">
        <div className="container">
          <div className="section__heading">
            <div>
              <p className="eyebrow">{settings.categories.eyebrow}</p>
              <h2>{settings.categories.title}</h2>
            </div>
            <p className="section__intro">{settings.categories.intro}</p>
          </div>

          <div className="category-grid">
            {settings.categories.items.map((category, index) => (
              <article className={`category-card category-card--${category.tone}`} key={`${category.name}-${index}`}>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <small>{category.products}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--cream" id="products">
        <div className="container">
          <div className="section__heading">
            <div>
              <p className="eyebrow">{settings.products.eyebrow}</p>
              <h2>{settings.products.title}</h2>
            </div>
            <p className="section__intro">{settings.products.intro}</p>
          </div>

          {featured.length ? (
            <>
              <div className="product-grid">
                {featured.map((product) => (
                  <article className="product-card" key={product.id}>
                    <div className={`product-card__art product-card__art--${product.tone}`} aria-hidden="true">
                      <ProductImage image={product.image} emoji={product.emoji} alt="" className="product-card__image" />
                      <span className="product-card__badge">{product.category}</span>
                    </div>
                    <div className="product-card__body">
                      <h3>{product.name}</h3>
                      <p className="product-card__price"><strong>{formatMoney(product.price)}</strong> <span>{product.unit}</span></p>
                      <Link to="/signup" className="product-card__link">{settings.interface.home.orderNow}</Link>
                    </div>
                  </article>
                ))}
              </div>
              <p className="section__note">{settings.products.note}</p>
            </>
          ) : (
            <div className="empty-state">
              <h3>Fresh picks are on the way</h3>
              <p>Our catalogue is being updated. Check back soon for what’s in season.</p>
            </div>
          )}
        </div>
      </section>

      <section className="section" id="why-us">
        <div className="container">
          <div className="section__heading section__heading--center">
            <div>
              <p className="eyebrow">{settings.reasons.eyebrow}</p>
              <h2>{settings.reasons.title}</h2>
            </div>
          </div>
          <div className="reason-grid">
            {settings.reasons.items.map((reason, index) => (
              <article className="reason-card" key={`${reason.title}-${index}`}>
                <h3>{reason.title}</h3>
                <p>{reason.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--cream" id="how-it-works">
        <div className="container">
          <div className="section__heading section__heading--center">
            <div>
              <p className="eyebrow">{settings.steps.eyebrow}</p>
              <h2>{settings.steps.title}</h2>
            </div>
          </div>
          <div className="steps-grid">
            {settings.steps.items.map((step, index) => (
              <article className="step-card" key={`${step.title}-${index}`}>
                <span className="step-card__number">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section location-section">
        <div className="container location-card">
          <div>
            <h2>{settings.location.titlePrefix} {settings.contact.location}</h2>
            <p>{settings.location.body}</p>
          </div>
          <Link to="/signup" className="btn btn--primary">{settings.location.ctaLabel}</Link>
        </div>
      </section>
    </div>
  )
}
