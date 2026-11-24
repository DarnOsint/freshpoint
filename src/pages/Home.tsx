import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ClipboardList,
  Handshake,
  Leaf,
  MapPin,
  PackageCheck,
  ShoppingBasket,
  Sprout,
  Store,
  Truck,
} from 'lucide-react'
import { config } from '../config'

const categories = [
  {
    emoji: '🥬',
    name: 'Vegetables',
    description: 'Harvested fresh, packed with goodness.',
    products: 'Tomatoes · Onions · Carrots · Spinach · Cabbage · Green pepper',
    tone: 'green',
  },
  {
    emoji: '🥭',
    name: 'Fruits',
    description: ' ripe, juicy and naturally sweet.',
    products: 'Mangoes · Bananas · Oranges · Lemons · Watermelon · Avocado',
    tone: 'orange',
  },
  {
    emoji: '🌾',
    name: 'Grains',
    description: 'Everyday staples for every kitchen.',
    products: 'Maize · Rice · Sorghum · Millet · Beans',
    tone: 'amber',
  },
  {
    emoji: '🥔',
    name: 'Tubers',
    description: 'Wholesome energy from the soil.',
    products: 'Irish potatoes · Sweet potatoes · Cassava · Yams',
    tone: 'brown',
  },
  {
    emoji: '🧄',
    name: 'Cooking essentials',
    description: 'The little things that make meals sing.',
    products: 'Garlic · Ginger · Chilli · Groundnuts',
    tone: 'red',
  },
  {
    emoji: '📦',
    name: 'Bulk orders',
    description: 'Reliable supply for larger buyers.',
    products: 'Wholesale vegetables, fruits and grains',
    tone: 'teal',
  },
]

const products = [
  { emoji: '🍅', name: 'Tomatoes', category: 'Vegetables', price: '800', unit: 'per kg', tone: 'red' },
  { emoji: '🥭', name: 'Mangoes', category: 'Fruits', price: '1,200', unit: 'per kg', tone: 'orange' },
  { emoji: '🥔', name: 'Irish potatoes', category: 'Tubers', price: '600', unit: 'per kg', tone: 'brown' },
  { emoji: '🥬', name: 'Cabbage', category: 'Vegetables', price: '500', unit: 'per head', tone: 'green' },
  { emoji: '🍌', name: 'Bananas', category: 'Fruits', price: '700', unit: 'per kg', tone: 'amber' },
  { emoji: '🫘', name: 'Beans', category: 'Grains', price: '1,500', unit: 'per kg', tone: 'teal' },
  { emoji: '🥕', name: 'Carrots', category: 'Vegetables', price: '900', unit: 'per kg', tone: 'orange' },
  { emoji: '🥜', name: 'Groundnuts', category: 'Cooking essentials', price: '1,800', unit: 'per kg', tone: 'brown' },
]

const reasons = [
  {
    icon: Sprout,
    title: 'Direct from the farm',
    text: 'We source from our own production, local farmers and trusted suppliers — cutting out the middlemen.',
  },
  {
    icon: BadgeCheck,
    title: 'Quality you can trust',
    text: 'Every order is selected, sorted and quality-checked before it reaches your doorstep.',
  },
  {
    icon: Store,
    title: 'Retail & wholesale',
    text: 'Buy a little for the household or in bulk for your business, restaurant or institution.',
  },
  {
    icon: Truck,
    title: 'Convenient delivery',
    text: 'Simple ordering and reliable doorstep delivery across Juba and surrounding areas.',
  },
]

const steps = [
  {
    icon: ClipboardList,
    title: 'Choose your produce',
    text: 'Browse fresh vegetables, fruits, grains and essentials by category.',
  },
  {
    icon: ShoppingBasket,
    title: 'Place your order',
    text: 'Sign up with your phone number and order as a household or bulk buyer.',
  },
  {
    icon: PackageCheck,
    title: 'We deliver fresh',
    text: 'Our team picks, packs and delivers your order — farm fresh and on time.',
  },
]

export function Home() {
  const { hash } = useLocation()

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
            <p className="eyebrow"><Leaf size={15} /> OrganicPoint / FreshPoint · A OnePlan Enterprise brand</p>
            <h1>Fresh from the farm. <span>Straight to your door.</span></h1>
            <p className="hero__lead">
              Your trusted marketplace for fresh vegetables, fruits, grains and everyday food essentials. Shop
              quality produce at competitive prices with convenient delivery across South Sudan.
            </p>
            <div className="hero__actions">
              <Link to="/signup" className="btn btn--primary btn--large">
                Start shopping <ArrowRight size={18} />
              </Link>
              <Link to="/#categories" className="btn btn--outline btn--large">Browse categories</Link>
            </div>
            <ul className="hero__points">
              <li><BadgeCheck size={18} /> Quality-checked produce</li>
              <li><Handshake size={18} /> Trusted local sourcing</li>
              <li><Truck size={18} /> Doorstep delivery</li>
            </ul>
          </div>

          <div className="hero__visual">
            <div className="hero__photo" role="img" aria-label="Fresh produce at a market" />
            <div className="hero__float hero__float--top">
              <span className="hero__float-icon">🌿</span>
              <div><strong>100% fresh</strong><small>Picked at its best</small></div>
            </div>
            <div className="hero__float hero__float--bottom">
              <span className="hero__float-icon">🚚</span>
              <div><strong>Delivered in Juba</strong><small>Retail &amp; wholesale</small></div>
            </div>
            <div className="hero__produce" aria-hidden="true">🍅 🥭 🥕 🥬 🍌 🌽</div>
          </div>
        </div>
      </section>

      <section className="stats-strip">
        <div className="container stats-strip__grid">
          <div><strong>6</strong><span>Product categories</span></div>
          <div><strong>100+</strong><span>Fresh everyday products</span></div>
          <div><strong>2</strong><span>Ways to shop: retail &amp; wholesale</span></div>
          <div><strong>1</strong><span>Goal: quality food for all</span></div>
        </div>
      </section>

      <section className="section" id="categories">
        <div className="container">
          <div className="section__heading">
            <div>
              <p className="eyebrow">What we offer</p>
              <h2>Everything fresh, all in one place</h2>
            </div>
            <p className="section__intro">
              From everyday vegetables to bulk grain supply, find the essentials your home or business needs.
            </p>
          </div>

          <div className="category-grid">
            {categories.map((category) => (
              <article className={`category-card category-card--${category.tone}`} key={category.name}>
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
              <p className="eyebrow">Fresh picks</p>
              <h2>Popular produce this week</h2>
            </div>
            <p className="section__intro">
              Competitive prices on quality produce. Create an account to place your order.
            </p>
          </div>

          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.name}>
                <div className={`product-card__art product-card__art--${product.tone}`} aria-hidden="true">
                  {product.emoji}
                  <span className="product-card__badge">{product.category}</span>
                </div>
                <div className="product-card__body">
                  <h3>{product.name}</h3>
                  <p className="product-card__price"><strong>SSP {product.price}</strong> <span>{product.unit}</span></p>
                  <Link to="/signup" className="product-card__link">Order now <ArrowRight size={15} /></Link>
                </div>
              </article>
            ))}
          </div>
          <p className="section__note">Prices are indicative and may change with season and availability.</p>
        </div>
      </section>

      <section className="section" id="why-us">
        <div className="container">
          <div className="section__heading section__heading--center">
            <div>
              <p className="eyebrow">Why FreshPoint</p>
              <h2>Food you can trust, service you can count on</h2>
            </div>
          </div>
          <div className="reason-grid">
            {reasons.map((reason) => (
              <article className="reason-card" key={reason.title}>
                <span className="reason-card__icon"><reason.icon size={24} /></span>
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
              <p className="eyebrow">How it works</p>
              <h2>Fresh food in three simple steps</h2>
            </div>
          </div>
          <div className="steps-grid">
            {steps.map((step, index) => (
              <article className="step-card" key={step.title}>
                <span className="step-card__number">0{index + 1}</span>
                <span className="step-card__icon"><step.icon size={26} /></span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                {index < steps.length - 1 ? <ArrowRight className="step-card__arrow" size={20} /> : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="wholesale" id="wholesale">
        <div className="container wholesale__inner">
          <div>
            <p className="eyebrow eyebrow--light"><Building2 size={15} /> For businesses &amp; institutions</p>
            <h2>Bulk produce, reliable supply, better prices</h2>
            <p>
              We supply restaurants, hotels, schools, retailers and institutions with wholesale vegetables,
              fruits and grains. Tell us what you need and we’ll source, aggregate and deliver it.
            </p>
            <div className="wholesale__actions">
              <Link to="/signup" className="btn btn--light btn--large">Create a wholesale account <ArrowRight size={18} /></Link>
              <a className="btn btn--outline-light btn--large" href={`mailto:${config.email}?subject=Wholesale%20enquiry`}>
                Talk to our team
              </a>
            </div>
          </div>
          <div className="wholesale__art" aria-hidden="true">
            <span>🌾</span><span>🍊</span><span>🥦</span><span>🍚</span>
          </div>
        </div>
      </section>

      <section className="section location-section">
        <div className="container location-card">
          <span className="location-card__icon"><MapPin size={26} /></span>
          <div>
            <h2>Proudly serving {config.location}</h2>
            <p>
              Rooted in South Sudan’s agricultural value chain, we make quality produce accessible, affordable and
              convenient for households, businesses and institutions.
            </p>
          </div>
          <Link to="/signup" className="btn btn--primary">Get started <ArrowRight size={17} /></Link>
        </div>
      </section>
    </>
  )
}
