import { useId, useState } from 'react'
import { Globe, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { ImageUploadField } from '../../components/ImageUploadField'
import {
  defaultSiteSettings, siteIcons, siteTones, useSiteSettings,
  type SiteAppInterface, type SiteCategory, type SiteFeature, type SiteIcon,
  type SiteInterface, type SiteLink, type SitePoint, type SiteSettings,
  type SiteStat, type SiteStep, type SiteTone,
} from '../../lib/site-content'
import type { AccountType, OrderStatus } from '../../lib/types'

type Tab = 'brand' | 'navigation' | 'hero' | 'stats' | 'categories' | 'sections' | 'wholesale' | 'footer' | 'interface' | 'app'

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'brand', label: 'Brand & contact' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'hero', label: 'Hero' },
  { id: 'stats', label: 'Stats' },
  { id: 'categories', label: 'Categories' },
  { id: 'sections', label: 'Sections' },
  { id: 'wholesale', label: 'Wholesale' },
  { id: 'footer', label: 'Footer' },
  { id: 'interface', label: 'Interface copy' },
  { id: 'app', label: 'Customer app' },
]

const accountTypes: AccountType[] = ['household', 'retailer', 'restaurant', 'wholesale']
const orderStatuses: OrderStatus[] = ['Pending', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled']

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

  function updateInterface<K extends keyof SiteInterface>(section: K, field: keyof SiteInterface[K], value: string) {
    patch((current) => ({
      ...current,
      interface: {
        ...current.interface,
        [section]: { ...current.interface[section], [field]: value },
      },
    }))
  }

  function updateApp<K extends keyof SiteAppInterface>(section: K, field: keyof SiteAppInterface[K], value: string) {
    patch((current) => ({
      ...current,
      interface: {
        ...current.interface,
        app: {
          ...current.interface.app,
          [section]: { ...current.interface.app[section], [field]: value },
        },
      },
    }))
  }

  function updateAuthPoint(index: number, changes: Partial<SitePoint>) {
    patch((current) => ({
      ...current,
      interface: {
        ...current.interface,
        authPanel: {
          ...current.interface.authPanel,
          points: updateAt(current.interface.authPanel.points, index, changes),
        },
      },
    }))
  }

  function updateSignupAccountType(type: AccountType, changes: Partial<{ label: string; description: string; icon: string }>) {
    patch((current) => ({
      ...current,
      interface: {
        ...current.interface,
        signup: {
          ...current.interface.signup,
          accountTypes: {
            ...current.interface.signup.accountTypes,
            [type]: { ...current.interface.signup.accountTypes[type], ...changes },
          },
        },
      },
    }))
  }

  function updateAppAccountType(type: AccountType, value: string) {
    patch((current) => ({
      ...current,
      interface: {
        ...current.interface,
        app: {
          ...current.interface.app,
          accountTypes: { ...current.interface.app.accountTypes, [type]: value },
        },
      },
    }))
  }

  function updateStatus(status: OrderStatus, value: string) {
    patch((current) => ({
      ...current,
      interface: {
        ...current.interface,
        app: {
          ...current.interface.app,
          statuses: { ...current.interface.app.statuses, [status]: value },
        },
      },
    }))
  }

  function removeItem(section: 'navigation' | 'stats' | 'categories' | 'reasons' | 'steps' | 'heroPoints' | 'authPoints', index: number) {
    patch((current) => {
      if (section === 'navigation') return { ...current, navigation: current.navigation.filter((_, position) => position !== index) }
      if (section === 'stats') return { ...current, stats: { ...current.stats, items: current.stats.items.filter((_, position) => position !== index) } }
      if (section === 'categories') return { ...current, categories: { ...current.categories, items: current.categories.items.filter((_, position) => position !== index) } }
      if (section === 'reasons') return { ...current, reasons: { ...current.reasons, items: current.reasons.items.filter((_, position) => position !== index) } }
      if (section === 'steps') return { ...current, steps: { ...current.steps, items: current.steps.items.filter((_, position) => position !== index) } }
      if (section === 'authPoints') {
        return {
          ...current,
          interface: {
            ...current.interface,
            authPanel: {
              ...current.interface.authPanel,
              points: current.interface.authPanel.points.filter((_, position) => position !== index),
            },
          },
        }
      }
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

  function itemActions(section: 'navigation' | 'stats' | 'categories' | 'reasons' | 'steps' | 'heroPoints' | 'authPoints', index: number) {
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
            <TextField label="Browser title" value={draft.seo.title} onChange={(value) => patch((current) => ({ ...current, seo: { ...current.seo, title: value } }))} />
            <TextField label="Search description" value={draft.seo.description} onChange={(value) => patch((current) => ({ ...current, seo: { ...current.seo, description: value } }))} multiline />
            <TextField label="Installed app name" value={draft.seo.manifestName} onChange={(value) => patch((current) => ({ ...current, seo: { ...current.seo, manifestName: value } }))} />
            <TextField label="Installed app short name" value={draft.seo.manifestShortName} onChange={(value) => patch((current) => ({ ...current, seo: { ...current.seo, manifestShortName: value } }))} />
            <TextField label="Theme colour" value={draft.seo.themeColor} onChange={(value) => patch((current) => ({ ...current, seo: { ...current.seo, themeColor: value } }))} />
            <TextField label="App name" value={draft.brand.appName} onChange={(value) => updateBrand('appName', value)} />
            <TextField label="Tagline" value={draft.brand.tagline} onChange={(value) => updateBrand('tagline', value)} />
            <TextField label="Brand eyebrow" value={draft.brand.eyebrow} onChange={(value) => updateBrand('eyebrow', value)} multiline />
            <TextField label="Hero image alt text" value={draft.brand.heroPhotoAlt} onChange={(value) => updateBrand('heroPhotoAlt', value)} />
            <TextField label="Footer description" value={draft.brand.footerAbout} onChange={(value) => updateBrand('footerAbout', value)} multiline />
            <TextField label="Footer tagline" value={draft.brand.footerTagline} onChange={(value) => updateBrand('footerTagline', value)} />
            <TextField label="Copyright line" value={draft.brand.copyright} onChange={(value) => updateBrand('copyright', value)} />
          </div>
          <ImageUploadField label="Hero image" value={draft.brand.heroPhotoKey} onChange={(key) => updateBrand('heroPhotoKey', key)} folder="brand" />
          <div className="admin-form__grid">
            <ImageUploadField label="Light logo" value={draft.brand.logoLightKey} onChange={(key) => updateBrand('logoLightKey', key)} folder="brand" />
            <ImageUploadField label="Dark logo" value={draft.brand.logoKey} onChange={(key) => updateBrand('logoKey', key)} folder="brand" />
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
            <TextField label="Floating card icon (top)" value={draft.hero.floatTopIcon} onChange={(value) => updateHero('floatTopIcon', value)} />
            <TextField label="Floating card title (top)" value={draft.hero.floatTopTitle} onChange={(value) => updateHero('floatTopTitle', value)} />
            <TextField label="Floating card text (top)" value={draft.hero.floatTopSubtitle} onChange={(value) => updateHero('floatTopSubtitle', value)} />
            <TextField label="Floating card icon (bottom)" value={draft.hero.floatBottomIcon} onChange={(value) => updateHero('floatBottomIcon', value)} />
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

    if (tab === 'footer') {
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

    if (tab === 'interface') {
      const common = draft.interface.common
      const auth = draft.interface.authPanel
      const login = draft.interface.login
      const signup = draft.interface.signup
      const verify = draft.interface.verify
      const forgot = draft.interface.forgot
      const reset = draft.interface.reset
      const adminLogin = draft.interface.adminLogin

      return (
        <div className="admin-form settings-section">
          <h2>Shared words &amp; messages</h2>
          <div className="admin-form__grid">
            <TextField label="Email label" value={common.emailLabel} onChange={(value) => updateInterface('common', 'emailLabel', value)} />
            <TextField label="Email placeholder" value={common.emailPlaceholder} onChange={(value) => updateInterface('common', 'emailPlaceholder', value)} />
            <TextField label="Username label" value={common.usernameLabel} onChange={(value) => updateInterface('common', 'usernameLabel', value)} />
            <TextField label="Username placeholder" value={common.usernamePlaceholder} onChange={(value) => updateInterface('common', 'usernamePlaceholder', value)} />
            <TextField label="Password label" value={common.passwordLabel} onChange={(value) => updateInterface('common', 'passwordLabel', value)} />
            <TextField label="Password placeholder" value={common.passwordPlaceholder} onChange={(value) => updateInterface('common', 'passwordPlaceholder', value)} />
            <TextField label="Show password" value={common.showPassword} onChange={(value) => updateInterface('common', 'showPassword', value)} />
            <TextField label="Hide password" value={common.hidePassword} onChange={(value) => updateInterface('common', 'hidePassword', value)} />
            <TextField label="Show confirmation" value={common.showConfirmation} onChange={(value) => updateInterface('common', 'showConfirmation', value)} />
            <TextField label="Hide confirmation" value={common.hideConfirmation} onChange={(value) => updateInterface('common', 'hideConfirmation', value)} />
            <TextField label="Forgot password link" value={common.forgotPassword} onChange={(value) => updateInterface('common', 'forgotPassword', value)} />
            <TextField label="Back to login link" value={common.backToLogin} onChange={(value) => updateInterface('common', 'backToLogin', value)} />
            <TextField label="Valid email error" value={common.validEmail} onChange={(value) => updateInterface('common', 'validEmail', value)} />
            <TextField label="Valid username error" value={common.validUsername} onChange={(value) => updateInterface('common', 'validUsername', value)} />
            <TextField label="Valid phone error" value={common.validPhone} onChange={(value) => updateInterface('common', 'validPhone', value)} />
            <TextField label="Short password error" value={common.passwordTooShort} onChange={(value) => updateInterface('common', 'passwordTooShort', value)} />
            <TextField label="Password mismatch error" value={common.passwordMismatch} onChange={(value) => updateInterface('common', 'passwordMismatch', value)} />
            <TextField label="Full code error" value={common.fullCode} onChange={(value) => updateInterface('common', 'fullCode', value)} />
            <TextField label="Country code label" value={common.countryCode} onChange={(value) => updateInterface('common', 'countryCode', value)} />
            <TextField label="Phone label" value={common.phoneLabel} onChange={(value) => updateInterface('common', 'phoneLabel', value)} />
            <TextField label="Phone optional note" value={common.phoneOptional} onChange={(value) => updateInterface('common', 'phoneOptional', value)} />
            <TextField label="Phone placeholder" value={common.phonePlaceholder} onChange={(value) => updateInterface('common', 'phonePlaceholder', value)} />
            <TextField label="Code group label" value={common.otpLabel} onChange={(value) => updateInterface('common', 'otpLabel', value)} />
            <TextField label="Digit label" value={common.digitLabel} onChange={(value) => updateInterface('common', 'digitLabel', value)} />
            <TextField label="Main navigation label" value={common.mainNavigation} onChange={(value) => updateInterface('common', 'mainNavigation', value)} />
            <TextField label="Open menu label" value={common.openMenu} onChange={(value) => updateInterface('common', 'openMenu', value)} />
            <TextField label="Close menu label" value={common.closeMenu} onChange={(value) => updateInterface('common', 'closeMenu', value)} />
            <TextField label="Admin console label" value={common.adminConsole} onChange={(value) => updateInterface('common', 'adminConsole', value)} />
            <TextField label="My account label" value={common.myAccount} onChange={(value) => updateInterface('common', 'myAccount', value)} />
            <TextField label="Sign out label" value={common.signOut} onChange={(value) => updateInterface('common', 'signOut', value)} />
            <TextField label="Message us label" value={common.messageUs} onChange={(value) => updateInterface('common', 'messageUs', value)} />
            <TextField label="Customer fallback name" value={common.customerFallback} onChange={(value) => updateInterface('common', 'customerFallback', value)} />
            <TextField label="Not available label" value={common.notApplicable} onChange={(value) => updateInterface('common', 'notApplicable', value)} />
            <TextField label="Loading text" value={common.loading} onChange={(value) => updateInterface('common', 'loading', value)} />
          </div>

          <h2>Auth side panel</h2>
          <div className="admin-form__grid">
            <TextField label="Eyebrow" value={auth.eyebrow} onChange={(value) => updateInterface('authPanel', 'eyebrow', value)} />
            <TextField label="Heading" value={auth.heading} onChange={(value) => updateInterface('authPanel', 'heading', value)} />
            <TextField label="Description" value={auth.body} onChange={(value) => updateInterface('authPanel', 'body', value)} multiline />
            <TextField label="Brand line" value={auth.brandLine} onChange={(value) => updateInterface('authPanel', 'brandLine', value)} />
            <TextField label="Back home link" value={auth.backHome} onChange={(value) => updateInterface('authPanel', 'backHome', value)} />
          </div>
          {auth.points.map((point, index) => (
            <div className="settings-item" key={index}>
              <div className="settings-item__head"><strong>Panel point {index + 1}</strong>{itemActions('authPoints', index)}</div>
              <div className="admin-form__grid">
                <TextField label="Text" value={point.text} onChange={(value) => updateAuthPoint(index, { text: value })} />
                <SelectField label="Icon" value={point.icon} options={siteIcons} onChange={(value: SiteIcon) => updateAuthPoint(index, { icon: value })} />
              </div>
            </div>
          ))}
          <button className="btn btn--outline btn--small" type="button" onClick={() => patch((current) => ({
            ...current,
            interface: {
              ...current.interface,
              authPanel: {
                ...current.interface.authPanel,
                points: [...current.interface.authPanel.points, { text: 'New point', icon: 'badge' }],
              },
            },
          }))}><Plus size={16} /> Add panel point</button>

          <h2>Login</h2>
          <div className="admin-form__grid">
            <TextField label="Eyebrow" value={login.eyebrow} onChange={(value) => updateInterface('login', 'eyebrow', value)} />
            <TextField label="Heading" value={login.heading} onChange={(value) => updateInterface('login', 'heading', value)} />
            <TextField label="Introduction" value={login.intro} onChange={(value) => updateInterface('login', 'intro', value)} multiline />
            <TextField label="Phone method" value={login.phoneMethod} onChange={(value) => updateInterface('login', 'phoneMethod', value)} />
            <TextField label="Email method" value={login.emailMethod} onChange={(value) => updateInterface('login', 'emailMethod', value)} />
            <TextField label="Username method" value={login.usernameMethod} onChange={(value) => updateInterface('login', 'usernameMethod', value)} />
            <TextField label="Method label" value={login.methodLabel} onChange={(value) => updateInterface('login', 'methodLabel', value)} />
            <TextField label="New here text" value={login.newHere} onChange={(value) => updateInterface('login', 'newHere', value)} />
            <TextField label="Create account link" value={login.createAccount} onChange={(value) => updateInterface('login', 'createAccount', value)} />
            <TextField label="Submit button" value={login.submit} onChange={(value) => updateInterface('login', 'submit', value)} />
            <TextField label="Loading text" value={login.loggingIn} onChange={(value) => updateInterface('login', 'loggingIn', value)} />
            <TextField label="Error message" value={login.error} onChange={(value) => updateInterface('login', 'error', value)} multiline />
            <TextField label="Missing password error" value={login.enterPassword} onChange={(value) => updateInterface('login', 'enterPassword', value)} />
          </div>

          <h2>Signup</h2>
          <div className="admin-form__grid">
            <TextField label="Eyebrow" value={signup.eyebrow} onChange={(value) => updateInterface('signup', 'eyebrow', value)} />
            <TextField label="Heading" value={signup.heading} onChange={(value) => updateInterface('signup', 'heading', value)} />
            <TextField label="Introduction" value={signup.intro} onChange={(value) => updateInterface('signup', 'intro', value)} multiline />
            <TextField label="Full name label" value={signup.fullNameLabel} onChange={(value) => updateInterface('signup', 'fullNameLabel', value)} />
            <TextField label="Full name placeholder" value={signup.fullNamePlaceholder} onChange={(value) => updateInterface('signup', 'fullNamePlaceholder', value)} />
            <TextField label="Name error" value={signup.nameError} onChange={(value) => updateInterface('signup', 'nameError', value)} />
            <TextField label="Username rule" value={signup.usernameRule} onChange={(value) => updateInterface('signup', 'usernameRule', value)} />
            <TextField label="Password placeholder" value={signup.passwordPlaceholder} onChange={(value) => updateInterface('signup', 'passwordPlaceholder', value)} />
            <TextField label="Confirm password label" value={signup.confirmPasswordLabel} onChange={(value) => updateInterface('signup', 'confirmPasswordLabel', value)} />
            <TextField label="Confirm password placeholder" value={signup.confirmPasswordPlaceholder} onChange={(value) => updateInterface('signup', 'confirmPasswordPlaceholder', value)} />
            <TextField label="Account type question" value={signup.shoppingAs} onChange={(value) => updateInterface('signup', 'shoppingAs', value)} />
            <TextField label="Terms text" value={signup.terms} onChange={(value) => updateInterface('signup', 'terms', value)} multiline />
            <TextField label="Terms error" value={signup.agreeError} onChange={(value) => updateInterface('signup', 'agreeError', value)} />
            <TextField label="Loading text" value={signup.creating} onChange={(value) => updateInterface('signup', 'creating', value)} />
            <TextField label="Submit button" value={signup.submit} onChange={(value) => updateInterface('signup', 'submit', value)} />
            <TextField label="Error message" value={signup.error} onChange={(value) => updateInterface('signup', 'error', value)} multiline />
            <TextField label="Existing account text" value={signup.alreadyAccount} onChange={(value) => updateInterface('signup', 'alreadyAccount', value)} />
            <TextField label="Login link" value={signup.loginLink} onChange={(value) => updateInterface('signup', 'loginLink', value)} />
          </div>
          {accountTypes.map((type) => (
            <div className="settings-item" key={type}>
              <div className="settings-item__head"><strong>{label(type)} account</strong></div>
              <div className="admin-form__grid">
                <TextField label="Label" value={signup.accountTypes[type].label} onChange={(value) => updateSignupAccountType(type, { label: value })} />
                <TextField label="Description" value={signup.accountTypes[type].description} onChange={(value) => updateSignupAccountType(type, { description: value })} />
                <TextField label="Icon" value={signup.accountTypes[type].icon} onChange={(value) => updateSignupAccountType(type, { icon: value })} />
              </div>
            </div>
          ))}

          <h2>Email verification</h2>
          <div className="admin-form__grid">
            <TextField label="Eyebrow" value={verify.eyebrow} onChange={(value) => updateInterface('verify', 'eyebrow', value)} />
            <TextField label="Heading" value={verify.heading} onChange={(value) => updateInterface('verify', 'heading', value)} />
            <TextField label="Wrong address text" value={verify.wrongAddress} onChange={(value) => updateInterface('verify', 'wrongAddress', value)} />
            <TextField label="Different email link" value={verify.differentEmail} onChange={(value) => updateInterface('verify', 'differentEmail', value)} />
            <TextField label="Introduction" value={verify.intro} onChange={(value) => updateInterface('verify', 'intro', value)} />
            <TextField label="Introduction suffix" value={verify.introSuffix} onChange={(value) => updateInterface('verify', 'introSuffix', value)} />
            <TextField label="Code label" value={verify.codeLabel} onChange={(value) => updateInterface('verify', 'codeLabel', value)} />
            <TextField label="Fallback password label" value={verify.fallbackPasswordLabel} onChange={(value) => updateInterface('verify', 'fallbackPasswordLabel', value)} />
            <TextField label="Fallback placeholder" value={verify.fallbackPlaceholder} onChange={(value) => updateInterface('verify', 'fallbackPlaceholder', value)} />
            <TextField label="Submit button" value={verify.submit} onChange={(value) => updateInterface('verify', 'submit', value)} />
            <TextField label="Loading text" value={verify.verifying} onChange={(value) => updateInterface('verify', 'verifying', value)} />
            <TextField label="Resend button" value={verify.resend} onChange={(value) => updateInterface('verify', 'resend', value)} />
            <TextField label="Resend countdown" value={verify.resendIn} onChange={(value) => updateInterface('verify', 'resendIn', value)} />
            <TextField label="Code error" value={verify.codeError} onChange={(value) => updateInterface('verify', 'codeError', value)} multiline />
            <TextField label="Resend error" value={verify.resendError} onChange={(value) => updateInterface('verify', 'resendError', value)} multiline />
            <TextField label="Missing password error" value={verify.enterPassword} onChange={(value) => updateInterface('verify', 'enterPassword', value)} />
          </div>

          <h2>Forgot password</h2>
          <div className="admin-form__grid">
            <TextField label="Eyebrow" value={forgot.eyebrow} onChange={(value) => updateInterface('forgot', 'eyebrow', value)} />
            <TextField label="Heading" value={forgot.heading} onChange={(value) => updateInterface('forgot', 'heading', value)} />
            <TextField label="Sent heading" value={forgot.sentHeading} onChange={(value) => updateInterface('forgot', 'sentHeading', value)} />
            <TextField label="Remembered text" value={forgot.remembered} onChange={(value) => updateInterface('forgot', 'remembered', value)} />
            <TextField label="Sent notice" value={forgot.notice} onChange={(value) => updateInterface('forgot', 'notice', value)} multiline />
            <TextField label="Next button" value={forgot.submitCode} onChange={(value) => updateInterface('forgot', 'submitCode', value)} />
            <TextField label="No email hint" value={forgot.noEmailHint} onChange={(value) => updateInterface('forgot', 'noEmailHint', value)} multiline />
            <TextField label="Introduction" value={forgot.intro} onChange={(value) => updateInterface('forgot', 'intro', value)} multiline />
            <TextField label="Submit button" value={forgot.send} onChange={(value) => updateInterface('forgot', 'send', value)} />
            <TextField label="Loading text" value={forgot.sending} onChange={(value) => updateInterface('forgot', 'sending', value)} />
            <TextField label="Error message" value={forgot.error} onChange={(value) => updateInterface('forgot', 'error', value)} multiline />
          </div>

          <h2>Reset password</h2>
          <div className="admin-form__grid">
            <TextField label="Eyebrow" value={reset.eyebrow} onChange={(value) => updateInterface('reset', 'eyebrow', value)} />
            <TextField label="Heading" value={reset.heading} onChange={(value) => updateInterface('reset', 'heading', value)} />
            <TextField label="Done heading" value={reset.doneHeading} onChange={(value) => updateInterface('reset', 'doneHeading', value)} />
            <TextField label="Help text" value={reset.needHelp} onChange={(value) => updateInterface('reset', 'needHelp', value)} />
            <TextField label="Done notice" value={reset.doneNotice} onChange={(value) => updateInterface('reset', 'doneNotice', value)} multiline />
            <TextField label="Done button" value={reset.doneCta} onChange={(value) => updateInterface('reset', 'doneCta', value)} />
            <TextField label="Introduction" value={reset.intro} onChange={(value) => updateInterface('reset', 'intro', value)} multiline />
            <TextField label="Code label" value={reset.codeLabel} onChange={(value) => updateInterface('reset', 'codeLabel', value)} />
            <TextField label="New password label" value={reset.newPasswordLabel} onChange={(value) => updateInterface('reset', 'newPasswordLabel', value)} />
            <TextField label="Confirm label" value={reset.confirmPasswordLabel} onChange={(value) => updateInterface('reset', 'confirmPasswordLabel', value)} />
            <TextField label="Confirm placeholder" value={reset.confirmPlaceholder} onChange={(value) => updateInterface('reset', 'confirmPlaceholder', value)} />
            <TextField label="Submit button" value={reset.submit} onChange={(value) => updateInterface('reset', 'submit', value)} />
            <TextField label="Loading text" value={reset.updating} onChange={(value) => updateInterface('reset', 'updating', value)} />
            <TextField label="Resend button" value={reset.resend} onChange={(value) => updateInterface('reset', 'resend', value)} />
            <TextField label="Resend countdown" value={reset.resendIn} onChange={(value) => updateInterface('reset', 'resendIn', value)} />
            <TextField label="Resend error" value={reset.resendError} onChange={(value) => updateInterface('reset', 'resendError', value)} multiline />
            <TextField label="Update error" value={reset.error} onChange={(value) => updateInterface('reset', 'error', value)} multiline />
            <TextField label="Missing email error" value={reset.enterEmailFirst} onChange={(value) => updateInterface('reset', 'enterEmailFirst', value)} />
          </div>

          <h2>Admin login</h2>
          <div className="admin-form__grid">
            <TextField label="Eyebrow" value={adminLogin.eyebrow} onChange={(value) => updateInterface('adminLogin', 'eyebrow', value)} />
            <TextField label="Heading" value={adminLogin.heading} onChange={(value) => updateInterface('adminLogin', 'heading', value)} />
            <TextField label="Footer text" value={adminLogin.footer} onChange={(value) => updateInterface('adminLogin', 'footer', value)} />
            <TextField label="Customer login link" value={adminLogin.goToLogin} onChange={(value) => updateInterface('adminLogin', 'goToLogin', value)} />
            <TextField label="Introduction" value={adminLogin.intro} onChange={(value) => updateInterface('adminLogin', 'intro', value)} multiline />
            <TextField label="Method label" value={adminLogin.methodLabel} onChange={(value) => updateInterface('adminLogin', 'methodLabel', value)} />
            <TextField label="Email method" value={adminLogin.emailMethod} onChange={(value) => updateInterface('adminLogin', 'emailMethod', value)} />
            <TextField label="Username method" value={adminLogin.usernameMethod} onChange={(value) => updateInterface('adminLogin', 'usernameMethod', value)} />
            <TextField label="Submit button" value={adminLogin.submit} onChange={(value) => updateInterface('adminLogin', 'submit', value)} />
            <TextField label="Loading text" value={adminLogin.signingIn} onChange={(value) => updateInterface('adminLogin', 'signingIn', value)} />
            <TextField label="Error message" value={adminLogin.error} onChange={(value) => updateInterface('adminLogin', 'error', value)} multiline />
            <TextField label="Missing details error" value={adminLogin.enterDetails} onChange={(value) => updateInterface('adminLogin', 'enterDetails', value)} />
          </div>

          <h2>404 &amp; small labels</h2>
          <div className="admin-form__grid">
            <TextField label="404 eyebrow" value={draft.interface.notFound.eyebrow} onChange={(value) => updateInterface('notFound', 'eyebrow', value)} />
            <TextField label="404 heading" value={draft.interface.notFound.heading} onChange={(value) => updateInterface('notFound', 'heading', value)} />
            <TextField label="404 message" value={draft.interface.notFound.body} onChange={(value) => updateInterface('notFound', 'body', value)} multiline />
            <TextField label="404 button" value={draft.interface.notFound.cta} onChange={(value) => updateInterface('notFound', 'cta', value)} />
            <TextField label="Order now link" value={draft.interface.home.orderNow} onChange={(value) => updateInterface('home', 'orderNow', value)} />
            <TextField label="Fallback produce" value={draft.interface.home.harvest} onChange={(value) => updateInterface('home', 'harvest', value)} />
          </div>
        </div>
      )
    }

    if (tab === 'app') {
      const app = draft.interface.app

      return (
        <div className="admin-form settings-section">
          <h2>Navigation</h2>
          <div className="admin-form__grid">
            <TextField label="Navigation label" value={app.shell.navigation} onChange={(value) => updateApp('shell', 'navigation', value)} />
            <TextField label="Home" value={app.shell.home} onChange={(value) => updateApp('shell', 'home', value)} />
            <TextField label="Shop" value={app.shell.shop} onChange={(value) => updateApp('shell', 'shop', value)} />
            <TextField label="Basket" value={app.shell.basket} onChange={(value) => updateApp('shell', 'basket', value)} />
            <TextField label="Orders" value={app.shell.orders} onChange={(value) => updateApp('shell', 'orders', value)} />
            <TextField label="Account" value={app.shell.account} onChange={(value) => updateApp('shell', 'account', value)} />
            <TextField label="Sign out" value={app.shell.signOut} onChange={(value) => updateApp('shell', 'signOut', value)} />
            <TextField label="Basket label" value={app.shell.basketAria} onChange={(value) => updateApp('shell', 'basketAria', value)} />
          </div>

          <h2>Account types</h2>
          <div className="admin-form__grid">
            {accountTypes.map((type) => (
              <TextField key={type} label={label(type)} value={app.accountTypes[type]} onChange={(value) => updateAppAccountType(type, value)} />
            ))}
          </div>

          <h2>Order statuses</h2>
          <div className="admin-form__grid">
            {orderStatuses.map((status) => (
              <TextField key={status} label={status} value={app.statuses[status]} onChange={(value) => updateStatus(status, value)} />
            ))}
          </div>

          <h2>Dashboard</h2>
          <div className="admin-form__grid">
            <TextField label="Eyebrow" value={app.dashboard.eyebrow} onChange={(value) => updateApp('dashboard', 'eyebrow', value)} />
            <TextField label="Welcome" value={app.dashboard.welcome} onChange={(value) => updateApp('dashboard', 'welcome', value)} />
            <TextField label="Introduction" value={app.dashboard.intro} onChange={(value) => updateApp('dashboard', 'intro', value)} multiline />
            <TextField label="Banner title" value={app.dashboard.bannerTitle} onChange={(value) => updateApp('dashboard', 'bannerTitle', value)} />
            <TextField label="Banner text" value={app.dashboard.bannerText} onChange={(value) => updateApp('dashboard', 'bannerText', value)} multiline />
            <TextField label="Banner button" value={app.dashboard.bannerCta} onChange={(value) => updateApp('dashboard', 'bannerCta', value)} />
            <TextField label="Orders stat" value={app.dashboard.ordersPlaced} onChange={(value) => updateApp('dashboard', 'ordersPlaced', value)} />
            <TextField label="Basket stat" value={app.dashboard.itemsInBasket} onChange={(value) => updateApp('dashboard', 'itemsInBasket', value)} />
            <TextField label="Products stat" value={app.dashboard.productsAvailable} onChange={(value) => updateApp('dashboard', 'productsAvailable', value)} />
            <TextField label="Quick actions heading" value={app.dashboard.quickActions} onChange={(value) => updateApp('dashboard', 'quickActions', value)} />
            <TextField label="Browse produce" value={app.dashboard.browseProduce} onChange={(value) => updateApp('dashboard', 'browseProduce', value)} />
            <TextField label="Browse hint" value={app.dashboard.browseProduceHint} onChange={(value) => updateApp('dashboard', 'browseProduceHint', value)} />
            <TextField label="Track orders" value={app.dashboard.trackOrders} onChange={(value) => updateApp('dashboard', 'trackOrders', value)} />
            <TextField label="Track hint" value={app.dashboard.trackOrdersHint} onChange={(value) => updateApp('dashboard', 'trackOrdersHint', value)} />
            <TextField label="Delivery details" value={app.dashboard.deliveryDetails} onChange={(value) => updateApp('dashboard', 'deliveryDetails', value)} />
            <TextField label="Delivery hint" value={app.dashboard.deliveryDetailsHint} onChange={(value) => updateApp('dashboard', 'deliveryDetailsHint', value)} />
            <TextField label="Recent orders" value={app.dashboard.recentOrders} onChange={(value) => updateApp('dashboard', 'recentOrders', value)} />
            <TextField label="View all" value={app.dashboard.viewAll} onChange={(value) => updateApp('dashboard', 'viewAll', value)} />
            <TextField label="One item" value={app.dashboard.item} onChange={(value) => updateApp('dashboard', 'item', value)} />
            <TextField label="Many items" value={app.dashboard.items} onChange={(value) => updateApp('dashboard', 'items', value)} />
            <TextField label="No orders title" value={app.dashboard.noOrders} onChange={(value) => updateApp('dashboard', 'noOrders', value)} />
            <TextField label="No orders text" value={app.dashboard.noOrdersHint} onChange={(value) => updateApp('dashboard', 'noOrdersHint', value)} multiline />
            <TextField label="Start shopping" value={app.dashboard.startShopping} onChange={(value) => updateApp('dashboard', 'startShopping', value)} />
          </div>

          <h2>Shop</h2>
          <div className="admin-form__grid">
            <TextField label="Eyebrow" value={app.shop.eyebrow} onChange={(value) => updateApp('shop', 'eyebrow', value)} />
            <TextField label="Heading" value={app.shop.heading} onChange={(value) => updateApp('shop', 'heading', value)} />
            <TextField label="Introduction" value={app.shop.intro} onChange={(value) => updateApp('shop', 'intro', value)} multiline />
            <TextField label="Search placeholder" value={app.shop.searchPlaceholder} onChange={(value) => updateApp('shop', 'searchPlaceholder', value)} />
            <TextField label="Filter label" value={app.shop.filterLabel} onChange={(value) => updateApp('shop', 'filterLabel', value)} />
            <TextField label="All categories" value={app.shop.all} onChange={(value) => updateApp('shop', 'all', value)} />
            <TextField label="Low stock" value={app.shop.lowStock} onChange={(value) => updateApp('shop', 'lowStock', value)} />
            <TextField label="Added label" value={app.shop.added} onChange={(value) => updateApp('shop', 'added', value)} />
            <TextField label="Add to basket" value={app.shop.addToBasket} onChange={(value) => updateApp('shop', 'addToBasket', value)} />
            <TextField label="Nothing found title" value={app.shop.nothingFound} onChange={(value) => updateApp('shop', 'nothingFound', value)} />
            <TextField label="Nothing found text" value={app.shop.nothingFoundHint} onChange={(value) => updateApp('shop', 'nothingFoundHint', value)} />
          </div>

          <h2>Basket &amp; checkout</h2>
          <div className="admin-form__grid">
            <TextField label="Eyebrow" value={app.cart.eyebrow} onChange={(value) => updateApp('cart', 'eyebrow', value)} />
            <TextField label="Heading" value={app.cart.heading} onChange={(value) => updateApp('cart', 'heading', value)} />
            <TextField label="Empty title" value={app.cart.emptyHeading} onChange={(value) => updateApp('cart', 'emptyHeading', value)} />
            <TextField label="Empty text" value={app.cart.emptyBody} onChange={(value) => updateApp('cart', 'emptyBody', value)} multiline />
            <TextField label="Browse produce" value={app.cart.browseProduce} onChange={(value) => updateApp('cart', 'browseProduce', value)} />
            <TextField label="Introduction" value={app.cart.intro} onChange={(value) => updateApp('cart', 'intro', value)} multiline />
            <TextField label="Delivery heading" value={app.cart.deliveryTitle} onChange={(value) => updateApp('cart', 'deliveryTitle', value)} />
            <TextField label="Name label" value={app.cart.nameLabel} onChange={(value) => updateApp('cart', 'nameLabel', value)} />
            <TextField label="Name placeholder" value={app.cart.namePlaceholder} onChange={(value) => updateApp('cart', 'namePlaceholder', value)} />
            <TextField label="Phone label" value={app.cart.phoneLabel} onChange={(value) => updateApp('cart', 'phoneLabel', value)} />
            <TextField label="Phone placeholder" value={app.cart.phonePlaceholder} onChange={(value) => updateApp('cart', 'phonePlaceholder', value)} />
            <TextField label="Address label" value={app.cart.addressLabel} onChange={(value) => updateApp('cart', 'addressLabel', value)} />
            <TextField label="Address placeholder" value={app.cart.addressPlaceholder} onChange={(value) => updateApp('cart', 'addressPlaceholder', value)} />
            <TextField label="Name error" value={app.cart.nameError} onChange={(value) => updateApp('cart', 'nameError', value)} />
            <TextField label="Phone error" value={app.cart.phoneError} onChange={(value) => updateApp('cart', 'phoneError', value)} />
            <TextField label="Address error" value={app.cart.addressError} onChange={(value) => updateApp('cart', 'addressError', value)} />
            <TextField label="Total label" value={app.cart.total} onChange={(value) => updateApp('cart', 'total', value)} />
            <TextField label="Place order button" value={app.cart.placeOrder} onChange={(value) => updateApp('cart', 'placeOrder', value)} />
            <TextField label="Confirmation note" value={app.cart.note} onChange={(value) => updateApp('cart', 'note', value)} multiline />
            <TextField label="Remove one label" value={app.cart.removeOne} onChange={(value) => updateApp('cart', 'removeOne', value)} />
            <TextField label="Add one label" value={app.cart.addOne} onChange={(value) => updateApp('cart', 'addOne', value)} />
            <TextField label="Remove label" value={app.cart.remove} onChange={(value) => updateApp('cart', 'remove', value)} />
          </div>

          <h2>Orders</h2>
          <div className="admin-form__grid">
            <TextField label="Eyebrow" value={app.orders.eyebrow} onChange={(value) => updateApp('orders', 'eyebrow', value)} />
            <TextField label="Heading" value={app.orders.heading} onChange={(value) => updateApp('orders', 'heading', value)} />
            <TextField label="Introduction" value={app.orders.intro} onChange={(value) => updateApp('orders', 'intro', value)} multiline />
            <TextField label="Empty title" value={app.orders.emptyHeading} onChange={(value) => updateApp('orders', 'emptyHeading', value)} />
            <TextField label="Empty text" value={app.orders.emptyBody} onChange={(value) => updateApp('orders', 'emptyBody', value)} multiline />
            <TextField label="Browse produce" value={app.orders.browseProduce} onChange={(value) => updateApp('orders', 'browseProduce', value)} />
          </div>

          <h2>Profile</h2>
          <div className="admin-form__grid">
            <TextField label="Eyebrow" value={app.profile.eyebrow} onChange={(value) => updateApp('profile', 'eyebrow', value)} />
            <TextField label="Heading" value={app.profile.heading} onChange={(value) => updateApp('profile', 'heading', value)} />
            <TextField label="Details heading" value={app.profile.accountDetails} onChange={(value) => updateApp('profile', 'accountDetails', value)} />
            <TextField label="More heading" value={app.profile.more} onChange={(value) => updateApp('profile', 'more', value)} />
            <TextField label="My orders" value={app.profile.myOrders} onChange={(value) => updateApp('profile', 'myOrders', value)} />
            <TextField label="My orders hint" value={app.profile.myOrdersHint} onChange={(value) => updateApp('profile', 'myOrdersHint', value)} />
            <TextField label="Contact support" value={app.profile.contactSupport} onChange={(value) => updateApp('profile', 'contactSupport', value)} />
            <TextField label="Support hint" value={app.profile.contactSupportHint} onChange={(value) => updateApp('profile', 'contactSupportHint', value)} />
            <TextField label="Sign out" value={app.profile.signOut} onChange={(value) => updateApp('profile', 'signOut', value)} />
            <TextField label="Username label" value={app.profile.username} onChange={(value) => updateApp('profile', 'username', value)} />
            <TextField label="Phone label" value={app.profile.phoneLabel} onChange={(value) => updateApp('profile', 'phoneLabel', value)} />
            <TextField label="Email label" value={app.profile.emailLabel} onChange={(value) => updateApp('profile', 'emailLabel', value)} />
            <TextField label="Account type label" value={app.profile.accountType} onChange={(value) => updateApp('profile', 'accountType', value)} />
          </div>
        </div>
      )
    }

    return null
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
