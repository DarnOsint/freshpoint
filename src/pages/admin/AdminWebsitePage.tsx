import { useId, useState } from 'react'
import { Globe, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import {
  defaultSiteSettings, siteIcons, siteTones, useSiteSettings,
  type SiteCategory, type SiteFeature, type SiteIcon, type SiteLink,
  type SitePoint, type SiteSettings, type SiteStat, type SiteStep, type SiteTone,
} from '../../lib/site-content'

type Tab = 'brand' | 'navigation' | 'hero' | 'stats' | 'categories' | 'sections' | 'wholesale' | 'footer'

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'brand', label: 'Brand & contact' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'hero', label: 'Hero' },
  { id: 'stats', label: 'Stats' },
  { id: 'categories', label: 'Categories' },
  { id: 'sections', label: 'Sections' },
  { id: 'wholesale', label: 'Wholesale' },
  { id: 'footer', label: 'Footer' },
]

function cloneDefaults(): SiteSettings {
  return JSON.parse(JSON.stringify(defaultSiteSettings)) as SiteSettings
}

function updateAt<T>(list: T[], index: number, changes: Partial<T>): T[] {
  return list.map((item, position) => position === index ? { ...item, ...changes } : item)
}

function label(value: string) {
  return value.replace(/^./, (char) => char.toUpperCase())
}

type TextFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  placeholder?: string
}

function TextField({ label: name, value, onChange, multiline, placeholder }: TextFieldProps) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{name}</label>
      {multiline ? (
        <textarea id={id} rows={3} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input id={id} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      )}
    </div>
  )
}

type SelectFieldProps<T extends string> = {
  label: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
}

function SelectField<T extends string>({ label: name, value, options, onChange }: SelectFieldProps<T>) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{name}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map((option) => <option key={option} value={option}>{label(option)}</option>)}
      </select>
    </div>
  )
}

export function AdminWebsitePage() {
  const { settings, loaded, saveSiteSettings, saving } = useSiteSettings()
  const [draft, setDraft] = useState<SiteSettings>(settings)
  const [seenLoaded, setSeenLoaded] = useState(loaded)
  const [tab, setTab] = useState<Tab>('brand')
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  if (seenLoaded !== loaded) {
    setSeenLoaded(loaded)
    if (!dirty) {
      setDraft(settings)
      setSaved(false)
    }
  }

  function patch(update: (current: SiteSettings) => SiteSettings) {
    setDraft((current) => update(current))
    setDirty(true)
    setSaved(false)
    setError('')
  }

  async function handleSave() {
    setError('')
    try {
      await saveSiteSettings(draft)
      setDirty(false)
      setSaved(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not save the website content. Please try again.')
    }
  }

  function updateBrand(field: keyof SiteSettings['brand'], value: string) {
    patch((current) => ({ ...current, brand: { ...current.brand, [field]: value } }))
  }

  function updateAnnouncement(field: keyof SiteSettings['announcement'], value: string) {
    patch((current) => ({ ...current, announcement: { ...current.announcement, [field]: value } }))
  }

  function updateContact(field: keyof SiteSettings['contact'], value: string) {
    patch((current) => ({ ...current, contact: { ...current.contact, [field]: value } }))
  }

  function updateHero(field: Exclude<keyof SiteSettings['hero'], 'points'>, value: string) {
    patch((current) => ({ ...current, hero: { ...current.hero, [field]: value } }))
  }

  function updateSection<K extends 'categories' | 'products' | 'reasons' | 'steps' | 'wholesale' | 'location' | 'footer'>(
    section: K,
    field: keyof SiteSettings[K],
    value: string,
  ) {
    patch((current) => ({ ...current, [section]: { ...current[section], [field]: value } }))
  }

  function updateLink(index: number, changes: Partial<SiteLink>) {
    patch((current) => ({ ...current, navigation: updateAt(current.navigation, index, changes) }))
  }

  function updatePoint(index: number, changes: Partial<SitePoint>) {
    patch((current) => ({ ...current, hero: { ...current.hero, points: updateAt(current.hero.points, index, changes) } }))
  }

  function updateStat(index: number, changes: Partial<SiteStat>) {
    patch((current) => ({ ...current, stats: { ...current.stats, items: updateAt(current.stats.items, index, changes) } }))
  }

  function updateCategory(index: number, changes: Partial<SiteCategory>) {
    patch((current) => ({ ...current, categories: { ...current.categories, items: updateAt(current.categories.items, index, changes) } }))
  }

  function updateReason(index: number, changes: Partial<SiteFeature>) {
    patch((current) => ({ ...current, reasons: { ...current.reasons, items: updateAt(current.reasons.items, index, changes) } }))
  }

  function updateStep(index: number, changes: Partial<SiteStep>) {
    patch((current) => ({ ...current, steps: { ...current.steps, items: updateAt(current.steps.items, index, changes) } }))
  }

  function removeItem(section: 'navigation' | 'stats' | 'categories' | 'reasons' | 'steps' | 'heroPoints', index: number) {
    patch((current) => {
      if (section === 'navigation') return { ...current, navigation: current.navigation.filter((_, position) => position !== index) }
      if (section === 'stats') return { ...current, stats: { ...current.stats, items: current.stats.items.filter((_, position) => position !== index) } }
      if (section === 'categories') return { ...current, categories: { ...current.categories, items: current.categories.items.filter((_, position) => position !== index) } }
      if (section === 'reasons') return { ...current, reasons: { ...current.reasons, items: current.reasons.items.filter((_, position) => position !== index) } }
      if (section === 'steps') return { ...current, steps: { ...current.steps, items: current.steps.items.filter((_, position) => position !== index) } }
      return { ...current, hero: { ...current.hero, points: current.hero.points.filter((_, position) => position !== index) } }
    })
  }

  function addItem(section: 'navigation' | 'stats' | 'categories' | 'reasons' | 'steps' | 'heroPoints') {
    patch((current) => {
      if (section === 'navigation') return { ...current, navigation: [...current.navigation, { label: 'New link', href: '/#home' }] }
      if (section === 'stats') return { ...current, stats: { ...current.stats, items: [...current.stats.items, { value: '1', label: 'New stat' }] } }
      if (section === 'categories') {
        return { ...current, categories: { ...current.categories, items: [...current.categories.items, { emoji: '🥬', name: 'New category', description: '', products: '', tone: 'green' }] } }
      }
      if (section === 'reasons') {
        return { ...current, reasons: { ...current.reasons, items: [...current.reasons.items, { icon: 'sprout', title: 'New reason', text: '' }] } }
      }
      if (section === 'steps') {
        return { ...current, steps: { ...current.steps, items: [...current.steps.items, { icon: 'clipboard', title: 'New step', text: '' }] } }
      }
      return { ...current, hero: { ...current.hero, points: [...current.hero.points, { text: 'New point', icon: 'badge' }] } }
    })
  }

  function itemActions(section: 'navigation' | 'stats' | 'categories' | 'reasons' | 'steps' | 'heroPoints', index: number) {
    return (
      <div className="settings-item__actions">
        <button type="button" onClick={() => removeItem(section, index)} aria-label={`Remove item ${index + 1}`}><Trash2 size={15} /></button>
      </div>
    )
  }

  function renderTab() {
    if (tab === 'brand') {
      return (
        <div className="admin-form settings-section">
          <div className="admin-form__grid">
            <TextField label="App name" value={draft.brand.appName} onChange={(value) => updateBrand('appName', value)} />
            <TextField label="Tagline" value={draft.brand.tagline} onChange={(value) => updateBrand('tagline', value)} />
            <TextField label="Brand eyebrow" value={draft.brand.eyebrow} onChange={(value) => updateBrand('eyebrow', value)} multiline />
            <TextField label="Hero image key or URL" value={draft.brand.heroPhotoKey} onChange={(value) => updateBrand('heroPhotoKey', value)} />
            <TextField label="Hero image alt text" value={draft.brand.heroPhotoAlt} onChange={(value) => updateBrand('heroPhotoAlt', value)} />
            <TextField label="Footer description" value={draft.brand.footerAbout} onChange={(value) => updateBrand('footerAbout', value)} multiline />
            <TextField label="Footer tagline" value={draft.brand.footerTagline} onChange={(value) => updateBrand('footerTagline', value)} />
            <TextField label="Copyright line" value={draft.brand.copyright} onChange={(value) => updateBrand('copyright', value)} />
          </div>
          <div className="admin-form__grid">
            <TextField label="Announcement left" value={draft.announcement.primary} onChange={(value) => updateAnnouncement('primary', value)} />
            <TextField label="Announcement right" value={draft.announcement.secondary} onChange={(value) => updateAnnouncement('secondary', value)} />
          </div>
          <div className="admin-form__grid">
            <TextField label="Location" value={draft.contact.location} onChange={(value) => updateContact('location', value)} />
            <TextField label="Email" value={draft.contact.email} onChange={(value) => updateContact('email', value)} />
            <TextField label="Phone" value={draft.contact.phone} onChange={(value) => updateContact('phone', value)} />
            <TextField label="Opening hours" value={draft.contact.hours} onChange={(value) => updateContact('hours', value)} />
          </div>
        </div>
      )
    }

    if (tab === 'navigation') {
      return (
        <div className="admin-form settings-section">
          <p className="settings-hint">These links appear in the site header and footer. Use <code>/#section-id</code> for page sections.</p>
          {draft.navigation.map((link, index) => (
            <div className="settings-item" key={index}>
              <div className="settings-item__head"><strong>Link {index + 1}</strong>{itemActions('navigation', index)}</div>
              <div className="admin-form__grid">
                <TextField label="Label" value={link.label} onChange={(value) => updateLink(index, { label: value })} />
                <TextField label="URL" value={link.href} onChange={(value) => updateLink(index, { href: value })} />
              </div>
            </div>
          ))}
          <button className="btn btn--outline btn--small" type="button" onClick={() => addItem('navigation')}><Plus size={16} /> Add link</button>
        </div>
      )
    }

    if (tab === 'hero') {
      return (
        <div className="admin-form settings-section">
          <div className="admin-form__grid">
            <TextField label="Eyebrow" value={draft.hero.eyebrow} onChange={(value) => updateHero('eyebrow', value)} multiline />
            <TextField label="Headline" value={draft.hero.title} onChange={(value) => updateHero('title', value)} />
            <TextField label="Highlighted headline" value={draft.hero.highlight} onChange={(value) => updateHero('highlight', value)} />
            <TextField label="Description" value={draft.hero.lead} onChange={(value) => updateHero('lead', value)} multiline />
            <TextField label="Primary button" value={draft.hero.primaryLabel} onChange={(value) => updateHero('primaryLabel', value)} />
            <TextField label="Secondary button" value={draft.hero.secondaryLabel} onChange={(value) => updateHero('secondaryLabel', value)} />
            <TextField label="Floating card title (top)" value={draft.hero.floatTopTitle} onChange={(value) => updateHero('floatTopTitle', value)} />
            <TextField label="Floating card text (top)" value={draft.hero.floatTopSubtitle} onChange={(value) => updateHero('floatTopSubtitle', value)} />
            <TextField label="Floating card title (bottom)" value={draft.hero.floatBottomTitle} onChange={(value) => updateHero('floatBottomTitle', value)} />
            <TextField label="Floating card text (bottom)" value={draft.hero.floatBottomSubtitle} onChange={(value) => updateHero('floatBottomSubtitle', value)} />
            <TextField label="Decorative produce" value={draft.hero.produce} onChange={(value) => updateHero('produce', value)} />
          </div>
          {draft.hero.points.map((point, index) => (
            <div className="settings-item" key={index}>
              <div className="settings-item__head"><strong>Point {index + 1}</strong>{itemActions('heroPoints', index)}</div>
              <div className="admin-form__grid">
                <TextField label="Text" value={point.text} onChange={(value) => updatePoint(index, { text: value })} />
                <SelectField label="Icon" value={point.icon} options={siteIcons} onChange={(value: SiteIcon) => updatePoint(index, { icon: value })} />
              </div>
            </div>
          ))}
          <button className="btn btn--outline btn--small" type="button" onClick={() => addItem('heroPoints')}><Plus size={16} /> Add point</button>
        </div>
      )
    }

    if (tab === 'stats') {
      return (
        <div className="admin-form settings-section">
          {draft.stats.items.map((stat, index) => (
            <div className="settings-item" key={index}>
              <div className="settings-item__head"><strong>Stat {index + 1}</strong>{itemActions('stats', index)}</div>
              <div className="admin-form__grid">
                <TextField label="Value" value={stat.value} onChange={(value) => updateStat(index, { value })} />
                <TextField label="Label" value={stat.label} onChange={(value) => updateStat(index, { label: value })} />
              </div>
            </div>
          ))}
          <button className="btn btn--outline btn--small" type="button" onClick={() => addItem('stats')}><Plus size={16} /> Add stat</button>
        </div>
      )
    }

    if (tab === 'categories') {
      return (
        <div className="admin-form settings-section">
          <div className="admin-form__grid">
            <TextField label="Eyebrow" value={draft.categories.eyebrow} onChange={(value) => updateSection('categories', 'eyebrow', value)} />
            <TextField label="Heading" value={draft.categories.title} onChange={(value) => updateSection('categories', 'title', value)} />
            <TextField label="Introduction" value={draft.categories.intro} onChange={(value) => updateSection('categories', 'intro', value)} multiline />
          </div>
          {draft.categories.items.map((category, index) => (
            <div className="settings-item" key={index}>
              <div className="settings-item__head"><strong>Category {index + 1}</strong>{itemActions('categories', index)}</div>
              <div className="admin-form__grid">
                <TextField label="Emoji" value={category.emoji} onChange={(value) => updateCategory(index, { emoji: value })} />
                <TextField label="Name" value={category.name} onChange={(value) => updateCategory(index, { name: value })} />
                <TextField label="Description" value={category.description} onChange={(value) => updateCategory(index, { description: value })} />
                <TextField label="Products" value={category.products} onChange={(value) => updateCategory(index, { products: value })} />
                <SelectField label="Colour" value={category.tone} options={siteTones} onChange={(value: SiteTone) => updateCategory(index, { tone: value })} />
              </div>
            </div>
          ))}
          <button className="btn btn--outline btn--small" type="button" onClick={() => addItem('categories')}><Plus size={16} /> Add category</button>
        </div>
      )
    }

    if (tab === 'sections') {
      return (
        <div className="admin-form settings-section">
          <h2>Featured products</h2>
          <div className="admin-form__grid">
            <TextField label="Eyebrow" value={draft.products.eyebrow} onChange={(value) => updateSection('products', 'eyebrow', value)} />
            <TextField label="Heading" value={draft.products.title} onChange={(value) => updateSection('products', 'title', value)} />
            <TextField label="Introduction" value={draft.products.intro} onChange={(value) => updateSection('products', 'intro', value)} multiline />
            <TextField label="Price note" value={draft.products.note} onChange={(value) => updateSection('products', 'note', value)} />
          </div>
          <h2>Why FreshPoint</h2>
          <div className="admin-form__grid">
            <TextField label="Eyebrow" value={draft.reasons.eyebrow} onChange={(value) => updateSection('reasons', 'eyebrow', value)} />
            <TextField label="Heading" value={draft.reasons.title} onChange={(value) => updateSection('reasons', 'title', value)} />
          </div>
          {draft.reasons.items.map((reason, index) => (
            <div className="settings-item" key={index}>
              <div className="settings-item__head"><strong>Reason {index + 1}</strong>{itemActions('reasons', index)}</div>
              <div className="admin-form__grid">
                <TextField label="Title" value={reason.title} onChange={(value) => updateReason(index, { title: value })} />
                <TextField label="Text" value={reason.text} onChange={(value) => updateReason(index, { text: value })} multiline />
                <SelectField label="Icon" value={reason.icon} options={siteIcons} onChange={(value: SiteIcon) => updateReason(index, { icon: value })} />
              </div>
            </div>
          ))}
          <button className="btn btn--outline btn--small" type="button" onClick={() => addItem('reasons')}><Plus size={16} /> Add reason</button>
          <h2>How it works</h2>
          <div className="admin-form__grid">
            <TextField label="Eyebrow" value={draft.steps.eyebrow} onChange={(value) => updateSection('steps', 'eyebrow', value)} />
            <TextField label="Heading" value={draft.steps.title} onChange={(value) => updateSection('steps', 'title', value)} />
          </div>
          {draft.steps.items.map((step, index) => (
            <div className="settings-item" key={index}>
              <div className="settings-item__head"><strong>Step {index + 1}</strong>{itemActions('steps', index)}</div>
              <div className="admin-form__grid">
                <TextField label="Title" value={step.title} onChange={(value) => updateStep(index, { title: value })} />
                <TextField label="Text" value={step.text} onChange={(value) => updateStep(index, { text: value })} multiline />
                <SelectField label="Icon" value={step.icon} options={siteIcons} onChange={(value: SiteIcon) => updateStep(index, { icon: value })} />
              </div>
            </div>
          ))}
          <button className="btn btn--outline btn--small" type="button" onClick={() => addItem('steps')}><Plus size={16} /> Add step</button>
        </div>
      )
    }

    if (tab === 'wholesale') {
      return (
        <div className="admin-form settings-section">
          <h2>Wholesale</h2>
          <div className="admin-form__grid">
            <TextField label="Eyebrow" value={draft.wholesale.eyebrow} onChange={(value) => updateSection('wholesale', 'eyebrow', value)} />
            <TextField label="Heading" value={draft.wholesale.title} onChange={(value) => updateSection('wholesale', 'title', value)} />
            <TextField label="Description" value={draft.wholesale.body} onChange={(value) => updateSection('wholesale', 'body', value)} multiline />
            <TextField label="Primary button" value={draft.wholesale.primaryLabel} onChange={(value) => updateSection('wholesale', 'primaryLabel', value)} />
            <TextField label="Secondary button" value={draft.wholesale.secondaryLabel} onChange={(value) => updateSection('wholesale', 'secondaryLabel', value)} />
            <TextField label="Email subject" value={draft.wholesale.subject} onChange={(value) => updateSection('wholesale', 'subject', value)} />
            <TextField label="Decorative produce" value={draft.wholesale.art} onChange={(value) => updateSection('wholesale', 'art', value)} />
          </div>
          <h2>Location</h2>
          <div className="admin-form__grid">
            <TextField label="Heading prefix" value={draft.location.titlePrefix} onChange={(value) => updateSection('location', 'titlePrefix', value)} />
            <TextField label="Description" value={draft.location.body} onChange={(value) => updateSection('location', 'body', value)} multiline />
            <TextField label="Button label" value={draft.location.ctaLabel} onChange={(value) => updateSection('location', 'ctaLabel', value)} />
          </div>
        </div>
      )
    }

    return (
      <div className="admin-form settings-section">
        <div className="admin-form__grid">
          <TextField label="Explore heading" value={draft.footer.exploreTitle} onChange={(value) => updateSection('footer', 'exploreTitle', value)} />
          <TextField label="Contact heading" value={draft.footer.contactTitle} onChange={(value) => updateSection('footer', 'contactTitle', value)} />
          <TextField label="CTA heading" value={draft.footer.ctaTitle} onChange={(value) => updateSection('footer', 'ctaTitle', value)} />
          <TextField label="CTA text" value={draft.footer.ctaBody} onChange={(value) => updateSection('footer', 'ctaBody', value)} multiline />
          <TextField label="CTA button" value={draft.footer.ctaLabel} onChange={(value) => updateSection('footer', 'ctaLabel', value)} />
          <TextField label="Create account link" value={draft.footer.createAccountLabel} onChange={(value) => updateSection('footer', 'createAccountLabel', value)} />
          <TextField label="Login link" value={draft.footer.loginLabel} onChange={(value) => updateSection('footer', 'loginLabel', value)} />
          <TextField label="Bottom line" value={draft.footer.bottomLine} onChange={(value) => updateSection('footer', 'bottomLine', value)} />
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <p className="eyebrow">Site content</p>
          <h1>Website</h1>
          <p>Edit every word, link and list your customers see on the public website.</p>
        </div>
        <button className="btn btn--primary btn--small" type="button" onClick={() => void handleSave()} disabled={saving || !dirty}>
          <Save size={16} /> {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </button>
      </header>

      <div className="settings-tabs" role="tablist" aria-label="Website sections">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`settings-tab${tab === item.id ? ' settings-tab--active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="settings-hint">
        {dirty ? 'You have unsaved changes.' : saved ? 'Saved for every visitor.' : 'Changes are published to the live website when you save.'}
      </p>
      {error ? <p className="field-error">{error}</p> : null}

      {renderTab()}

      <button
        className="btn btn--outline btn--small"
        type="button"
        onClick={() => {
          if (!window.confirm('Replace all website content with the original defaults? Save to publish.')) return
          setDraft(cloneDefaults())
          setDirty(true)
          setSaved(false)
          setError('')
        }}
      >
        <RotateCcw size={16} /> Restore defaults
      </button>

      <p className="settings-hint"><Globe size={14} /> Changes appear on the public site immediately after saving.</p>
    </div>
  )
}
