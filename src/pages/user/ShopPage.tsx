import { ProductCatalogue } from '../../components/ProductCatalogue'
import { useSiteSettings } from '../../lib/site-content'

export function ShopPage() {
  const { settings } = useSiteSettings()
  const copy = settings.interface.app.shop

  return (
    <div className="app-page">
      <header className="app-page__head">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.heading}</h1>
          <p>{copy.intro}</p>
        </div>
      </header>

      <ProductCatalogue />
    </div>
  )
}
