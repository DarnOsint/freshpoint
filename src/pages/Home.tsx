import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Building2, Leaf, MapPin } from 'lucide-react'
import { ProductImage } from '../components/ProductImage'
import { imageUrl } from '../lib/assets'
import { useData } from '../lib/data-store'
import { formatMoney } from '../lib/format'
import { useSiteSettings } from '../lib/site-content'
import { siteIcon } from '../lib/site-icons'

export function Home() {
  const { hash } = useLocation()
  const { products } = useData()
  const { settings } = useSiteSettings()
  const [heroPhotoLoaded, setHeroPhotoLoaded] = useState(false)
  const heroImage = imageUrl(settings.brand.heroPhotoKey, '/images/hero-market.jpg')
  const featured = products.filter((product) => product.active !== false).slice(0, 8)

  useEffect(() => {
    if (!hash) return
    const target = document.querySelector(hash)
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  return (
    <>
      <section className="hero" id="home">
        <div className="container hero__grid">
          <div className="hero__copy">
            <p className="eyebrow"><Leaf size={15} /> {settings.hero.eyebrow}</p>
            <h1>{settings.hero.title} <span>{settings.hero.highlight}</span></h1>
            <p className="hero__lead">{settings.hero.lead}</p>
            <div className="hero__actions">
              <Link to="/signup" className="btn btn--primary btn--large">
                {settings.hero.primaryLabel} <ArrowRight size={18} />
              </Link>
              <Link to="/#categories" className="btn btn--outline btn--large">{settings.hero.secondaryLabel}</Link>
            </div>
            <ul className="hero__points">
              {settings.hero.points.map((point, index) => {
                const Icon = siteIcon(point.icon)
                return <li key={`${point.text}-${index}`}><Icon size={18} /> {point.text}</li>
              })}
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
              {!heroPhotoLoaded ? (
                <div className="hero__harvest" aria-hidden="true">
                  {settings.interface.home.harvest.split(/\s+/).filter(Boolean).map((emoji, index) => <span key={`${emoji}-${index}`}>{emoji}</span>)}
                </div>
              ) : null}
            </div>
            <div className="hero__float hero__float--top">
              <span className="hero__float-icon">{settings.hero.floatTopIcon}</span>
              <div><strong>{settings.hero.floatTopTitle}</strong><small>{settings.hero.floatTopSubtitle}</small></div>
            </div>
            <div className="hero__float hero__float--bottom">
              <span className="hero__float-icon">{settings.hero.floatBottomIcon}</span>
              <div><strong>{settings.hero.floatBottomTitle}</strong><small>{settings.hero.floatBottomSubtitle}</small></div>
            </div>
            <div className="hero__produce" aria-hidden="true">{settings.hero.produce}</div>
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
                <div className="category-card__art" aria-hidden="true">{category.emoji}</div>
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
                  <Link to="/signup" className="product-card__link">{settings.interface.home.orderNow} <ArrowRight size={15} /></Link>
                </div>
              </article>
            ))}
          </div>
          <p className="section__note">{settings.products.note}</p>
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
            {settings.reasons.items.map((reason, index) => {
              const Icon = siteIcon(reason.icon)
              return (
                <article className="reason-card" key={`${reason.title}-${index}`}>
                  <span className="reason-card__icon"><Icon size={24} /></span>
                  <h3>{reason.title}</h3>
                  <p>{reason.text}</p>
                </article>
              )
            })}
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
            {settings.steps.items.map((step, index) => {
              const Icon = siteIcon(step.icon)
              return (
                <article className="step-card" key={`${step.title}-${index}`}>
                  <span className="step-card__number">0{index + 1}</span>
                  <span className="step-card__icon"><Icon size={26} /></span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                  {index < settings.steps.items.length - 1 ? <ArrowRight className="step-card__arrow" size={20} /> : null}
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="wholesale" id="wholesale">
        <div className="container wholesale__inner">
          <div>
            <p className="eyebrow eyebrow--light"><Building2 size={15} /> {settings.wholesale.eyebrow}</p>
            <h2>{settings.wholesale.title}</h2>
            <p>{settings.wholesale.body}</p>
            <div className="wholesale__actions">
              <Link to="/signup" className="btn btn--light btn--large">{settings.wholesale.primaryLabel} <ArrowRight size={18} /></Link>
              <a
                className="btn btn--outline-light btn--large"
                href={`mailto:${settings.contact.email}?subject=${encodeURIComponent(settings.wholesale.subject)}`}
              >
                {settings.wholesale.secondaryLabel}
              </a>
            </div>
          </div>
          <div className="wholesale__art" aria-hidden="true">
            {settings.wholesale.art.split(/\s+/).filter(Boolean).map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}
          </div>
        </div>
      </section>

      <section className="section location-section">
        <div className="container location-card">
          <span className="location-card__icon"><MapPin size={26} /></span>
          <div>
            <h2>{settings.location.titlePrefix} {settings.contact.location}</h2>
            <p>{settings.location.body}</p>
          </div>
          <Link to="/signup" className="btn btn--primary">{settings.location.ctaLabel} <ArrowRight size={17} /></Link>
        </div>
      </section>
    </>
  )
}
