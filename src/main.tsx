import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App.tsx'
import { store } from './store/index.ts'
import { initLogger } from './logger.ts'
import './App.css'
import './styles/themes.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

// Apply saved theme synchronously before React renders to prevent flash of
// unstyled content.  The full settings load (with defaults) happens inside
// settingsSlice; here we just need the theme id.
try {
  const raw = localStorage.getItem('scxffld:settings')
  const parsed = raw ? (JSON.parse(raw) as { theme?: { activeTheme?: string } }) : null
  const theme = parsed?.theme?.activeTheme || 'dark'
  document.documentElement.setAttribute('data-theme', theme)
} catch {
  document.documentElement.setAttribute('data-theme', 'dark')
}

// Initialise the logger early so all console output is captured from the start
initLogger()

// Persist settings to localStorage whenever they change
let lastSettings = store.getState().settings.settings
store.subscribe(() => {
  const current = store.getState().settings.settings
  if (current !== lastSettings) {
    lastSettings = current
    try {
      localStorage.setItem('scxffld:settings', JSON.stringify(current))
    } catch {
      // ignore storage errors (e.g. private browsing quota exceeded)
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
)
