import {
  BadgeCheck,
  ClipboardList,
  Handshake,
  PackageCheck,
  ShoppingBasket,
  Sprout,
  Store,
  Truck,
  type LucideIcon,
} from 'lucide-react'
import type { SiteIcon } from './site-content'

export const siteIconMap: Record<SiteIcon, LucideIcon> = {
  sprout: Sprout,
  badge: BadgeCheck,
  store: Store,
  truck: Truck,
  handshake: Handshake,
  clipboard: ClipboardList,
  basket: ShoppingBasket,
  package: PackageCheck,
}

export function siteIcon(icon: SiteIcon): LucideIcon {
  return siteIconMap[icon] ?? siteIconMap.sprout
}
