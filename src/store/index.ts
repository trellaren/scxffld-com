import { configureStore, type Middleware } from '@reduxjs/toolkit'
import workspaceReducer from './workspaceSlice'
import authReducer from './authSlice'
import timelineReducer from './timelineSlice'
import aiReducer from './aiSlice'
import settingsReducer from './settingsSlice'
import logReducer from './logSlice'
import { serializeAiState, AI_STORAGE_KEY } from './aiSlice'

// High-frequency or purely internal actions that would make the log too noisy.
const SILENT_ACTIONS = new Set([
  'workspace/setActivePanel',
  'workspace/setActiveTab',
])

// Middleware that forwards every meaningful dispatched action to the console so
// that the logger (which intercepts console.*) picks it up and shows it in the
// LogViewer and, on Electron, writes it to the session log file.
const actionLogMiddleware: Middleware = () => (next) => (action) => {
  const result = next(action)
  if (typeof action === 'object' && action !== null && 'type' in action) {
    const type = (action as { type: string }).type
    if (!type.startsWith('log/') && !SILENT_ACTIONS.has(type)) {
      // Use console.log so that, once initLogger() has run, this output is
      // captured by the in-app log store and (on Electron) the session file.
      console.log(`[Action] ${type}`)
    }
  }
  return result
}

export const store = configureStore({
  reducer: {
    workspace: workspaceReducer,
    auth: authReducer,
    timeline: timelineReducer,
    ai: aiReducer,
    settings: settingsReducer,
    log: logReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(actionLogMiddleware),
})

// Persist AI state to localStorage whenever it changes so returning users
// have their model configs and selected model available immediately on load.
let lastAiState = store.getState().ai
store.subscribe(() => {
  const currentAiState = store.getState().ai
  if (currentAiState !== lastAiState) {
    lastAiState = currentAiState
    try {
      localStorage.setItem(AI_STORAGE_KEY, serializeAiState(currentAiState))
    } catch {
      // Ignore storage quota errors
    }
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
