type TabIconProps = {
  name: 'home' | 'cart' | 'orders' | 'profile'
}

export function TabIcon({ name }: TabIconProps) {
  return (
    <svg className="app-tab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === 'home' ? <><path d="M3 10.6 12 3l9 7.6" /><path d="M5.5 9.3V21h13V9.3" /><path d="M10 21v-6h4v6" /></> : null}
      {name === 'cart' ? <><path d="M3 4h2.4l2.4 11h11.5l2.2-8H6.2" /><circle cx="9.5" cy="19.5" r="1.4" /><circle cx="18" cy="19.5" r="1.4" /></> : null}
      {name === 'orders' ? <><rect x="5" y="3" width="14" height="18" rx="2.5" /><path d="M9 8h6M9 12h6M9 16h4" /></> : null}
      {name === 'profile' ? <><circle cx="12" cy="8" r="3.6" /><path d="M5 20c1.1-3.4 3.6-5.2 7-5.2s5.9 1.8 7 5.2" /></> : null}
    </svg>
  )
}
