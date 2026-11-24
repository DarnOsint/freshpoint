import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import { AuthProvider } from './lib/auth'
import { DataProvider } from './lib/data-context'
import { SiteSettingsProvider } from './lib/site-settings'
import './index.css'

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <SiteSettingsProvider>
            <App />
          </SiteSettingsProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
