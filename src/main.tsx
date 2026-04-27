import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App.tsx'
import { store } from './store/index.ts'
import { initLogger } from './logger.ts'
import './App.css'
import './styles/themes.css'

// Initialise the logger early so all console output is captured from the start
initLogger()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
)
