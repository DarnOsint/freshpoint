import { createContext, useContext } from 'react'
import defaults from './site-defaults.json'
import type { OrderStatus } from './types'

export type SiteTone = 'green' | 'orange' | 'amber' | 'brown' | 'red' | 'teal'
export type SiteIcon = 'sprout' | 'badge' | 'store' | 'truck' | 'handshake' | 'clipboard' | 'basket' | 'package'

export type SiteLink = { label: string; href: string }
export type SitePoint = { text: string; icon: SiteIcon }

const phoneHiddenSections = new Set(['categories', 'why-us', 'how-it-works'])

export function isHiddenPhoneSection(href: string) {
  return phoneHiddenSections.has(href.replace(/^\/?#?/, ''))
}

export type SiteStat = { value: string; label: string }
export type SiteCategory = {
  emoji: string
  name: string
  description: string
  products: string
  tone: SiteTone
}
export type SiteFeature = { icon: SiteIcon; title: string; text: string }
export type SiteStep = { icon: SiteIcon; title: string; text: string }

export type SiteAppInterface = {
  shell: {
    navigation: string
    home: string
    shop: string
    basket: string
    orders: string
    account: string
    profile: string
    signOut: string
    basketAria: string
  }
  statuses: Record<OrderStatus, string>
  dashboard: {
    eyebrow: string
    welcome: string
    intro: string
    bannerTitle: string
    bannerText: string
    bannerCta: string
    catalogueTitle: string
    catalogueIntro: string
    ordersPlaced: string
    itemsInBasket: string
    productsAvailable: string
    quickActions: string
    browseProduce: string
    browseProduceHint: string
    trackOrders: string
    trackOrdersHint: string
    deliveryDetails: string
    deliveryDetailsHint: string
    recentOrders: string
    viewAll: string
    item: string
    items: string
    noOrders: string
    noOrdersHint: string
    startShopping: string
  }
  shop: {
    eyebrow: string
    heading: string
    intro: string
    searchPlaceholder: string
    filterLabel: string
    all: string
    lowStock: string
    addToBasket: string
    selectLabel: string
    decreaseLabel: string
    increaseLabel: string
    nothingFound: string
    nothingFoundHint: string
  }
  cart: {
    eyebrow: string
    heading: string
    emptyHeading: string
    emptyBody: string
    browseProduce: string
    intro: string
    deliveryTitle: string
    nameLabel: string
    namePlaceholder: string
    phoneLabel: string
    phonePlaceholder: string
    addressLabel: string
    addressPlaceholder: string
    nameError: string
    phoneError: string
    addressError: string
    total: string
    placeOrder: string
    note: string
    removeOne: string
    addOne: string
    remove: string
  }
  orders: {
    eyebrow: string
    heading: string
    intro: string
    emptyHeading: string
    emptyBody: string
    browseProduce: string
  }
  profile: {
    eyebrow: string
    heading: string
    accountDetails: string
    more: string
    myOrders: string
    myOrdersHint: string
    contactSupport: string
    contactSupportHint: string
    signOut: string
    username: string
    phoneLabel: string
    emailLabel: string
    fullNameLabel: string
    readOnlyHint: string
    summaryTitle: string
    ordersPlaced: string
    itemsOrdered: string
    amountPaid: string
    detailsError: string
    usernameError: string
    saveDetails: string
    savingDetails: string
    detailsSaved: string
    passwordTitle: string
    passwordHint: string
    newPassword: string
    confirmPassword: string
    changePassword: string
    changingPassword: string
    passwordMin: string
    passwordMismatch: string
    passwordSuccess: string
    passwordError: string
  }
}

export type SiteInterface = {
  authPanel: {
    eyebrow: string
    heading: string
    body: string
    points: SitePoint[]
    brandLine: string
    backHome: string
  }
  common: {
    emailLabel: string
    emailPlaceholder: string
    usernameLabel: string
    usernamePlaceholder: string
    passwordLabel: string
    passwordPlaceholder: string
    hidePassword: string
    showPassword: string
    hideConfirmation: string
    showConfirmation: string
    forgotPassword: string
    backToLogin: string
    validEmail: string
    validUsername: string
    validPhone: string
    passwordTooShort: string
    passwordMismatch: string
    fullCode: string
    countryCode: string
    phoneLabel: string
    phoneOptional: string
    phonePlaceholder: string
    otpLabel: string
    digitLabel: string
    mainNavigation: string
    openMenu: string
    closeMenu: string
    adminConsole: string
    myAccount: string
    signOut: string
    messageUs: string
    customerFallback: string
    notApplicable: string
    loading: string
  }
  login: {
    eyebrow: string
    heading: string
    intro: string
    phoneMethod: string
    emailMethod: string
    usernameMethod: string
    methodLabel: string
    newHere: string
    createAccount: string
    loggingIn: string
    submit: string
    error: string
    enterPassword: string
  }
  signup: {
    eyebrow: string
    heading: string
    intro: string
    fullNameLabel: string
    fullNamePlaceholder: string
    nameError: string
    usernameRule: string
    passwordPlaceholder: string
    confirmPasswordLabel: string
    confirmPasswordPlaceholder: string
    terms: string
    agreeError: string
    creating: string
    submit: string
    error: string
    alreadyAccount: string
    loginLink: string
  }
  verify: {
    eyebrow: string
    heading: string
    wrongAddress: string
    differentEmail: string
    intro: string
    introSuffix: string
    codeLabel: string
    fallbackPasswordLabel: string
    fallbackPlaceholder: string
    verifying: string
    submit: string
    resend: string
    resendIn: string
    codeError: string
    resendError: string
    enterPassword: string
  }
  forgot: {
    eyebrow: string
    heading: string
    sentHeading: string
    remembered: string
    notice: string
    submitCode: string
    noEmailHint: string
    intro: string
    send: string
    sending: string
    error: string
  }
  reset: {
    eyebrow: string
    heading: string
    doneHeading: string
    needHelp: string
    doneNotice: string
    doneCta: string
    intro: string
    codeLabel: string
    newPasswordLabel: string
    confirmPasswordLabel: string
    confirmPlaceholder: string
    submit: string
    updating: string
    resend: string
    resendIn: string
    resendError: string
    error: string
    enterEmailFirst: string
  }
  adminLogin: {
    eyebrow: string
    heading: string
    footer: string
    goToLogin: string
    intro: string
    methodLabel: string
    emailMethod: string
    usernameMethod: string
    submit: string
    signingIn: string
    error: string
    enterDetails: string
  }
  notFound: { eyebrow: string; heading: string; body: string; cta: string }
  home: { orderNow: string; harvest: string }
  app: SiteAppInterface
}

export type SiteSettings = {
  seo: {
    title: string
    description: string
    manifestName: string
    manifestShortName: string
    themeColor: string
  }
  brand: {
    appName: string
    tagline: string
    eyebrow: string
    footerAbout: string
    footerTagline: string
    copyright: string
    heroPhotoKey: string
    heroPhotoAlt: string
    logoKey: string
    logoLightKey: string
  }
  announcement: { primary: string; secondary: string }
  contact: { location: string; email: string; phone: string; hours: string }
  navigation: SiteLink[]
  hero: {
    eyebrow: string
    title: string
    highlight: string
    lead: string
    primaryLabel: string
    secondaryLabel: string
    points: SitePoint[]
    floatTopIcon: string
    floatTopTitle: string
    floatTopSubtitle: string
    floatBottomIcon: string
    floatBottomTitle: string
    floatBottomSubtitle: string
    produce: string
  }
  stats: { items: SiteStat[] }
  categories: {
    eyebrow: string
    title: string
    intro: string
    items: SiteCategory[]
  }
  products: { eyebrow: string; title: string; intro: string; note: string }
  reasons: { eyebrow: string; title: string; items: SiteFeature[] }
  steps: { eyebrow: string; title: string; items: SiteStep[] }
  location: { titlePrefix: string; body: string; ctaLabel: string }
  footer: {
    exploreTitle: string
    contactTitle: string
    ctaTitle: string
    ctaBody: string
    ctaLabel: string
    bottomLine: string
    createAccountLabel: string
    loginLabel: string
  }
  interface: SiteInterface
}

export const defaultSiteSettings = defaults as unknown as SiteSettings

export const siteTones: SiteTone[] = ['green', 'orange', 'amber', 'brown', 'red', 'teal']
export const siteIcons: SiteIcon[] = ['sprout', 'badge', 'store', 'truck', 'handshake', 'clipboard', 'basket', 'package']

function mergeValue<T>(base: T, incoming: unknown): T {
  if (Array.isArray(base)) return Array.isArray(incoming) ? incoming as T : base
  if (base && typeof base === 'object') {
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return base
    const source = base as Record<string, unknown>
    const result: Record<string, unknown> = { ...source }
    for (const [key, value] of Object.entries(incoming as Record<string, unknown>)) {
      if (key in source) result[key] = mergeValue(source[key], value)
    }
    return result as T
  }
  return incoming !== undefined && typeof incoming === typeof base ? incoming as T : base
}

export function mergeSiteSettings(base: SiteSettings, incoming: unknown): SiteSettings {
  return mergeValue(base, incoming)
}

export type SiteSettingsValue = {
  settings: SiteSettings
  loaded: boolean
  saveSiteSettings: (settings: SiteSettings) => Promise<void>
  saving: boolean
}

export const SiteSettingsContext = createContext<SiteSettingsValue | null>(null)

export function useSiteSettings() {
  const value = useContext(SiteSettingsContext)
  if (!value) throw new Error('useSiteSettings must be used inside SiteSettingsProvider')
  return value
}
