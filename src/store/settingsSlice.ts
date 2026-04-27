import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { generateId } from '../utils'

export interface AIApiSettings {
  provider: string
  apiKey: string
  baseUrl: string
  model: string
}

export interface PluginEntry {
  id: string
  name: string
  enabled: boolean
  config: Record<string, string>
}

export interface ThemeSettings {
  activeTheme: string
}

export interface UserRecord {
  id: string
  username: string
  displayName: string
  role: string
}

export interface TeamRecord {
  id: string
  name: string
  members: string[]
}

export type RepositoryType = 'git' | 'filestore' | 'database' | 'versioning'

export interface RepositoryRecord {
  id: string
  name: string
  type: RepositoryType
  url: string
}

export interface AppSettings {
  aiApi: AIApiSettings
  plugins: PluginEntry[]
  theme: ThemeSettings
  users: UserRecord[]
  teams: TeamRecord[]
  repositories: RepositoryRecord[]
}

export interface SettingsState {
  settings: AppSettings
  open: boolean
}

const defaultSettings: AppSettings = {
  aiApi: {
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
    model: 'gpt-4',
  },
  plugins: [],
  theme: {
    activeTheme: 'dark',
  },
  users: [],
  teams: [],
  repositories: [],
}

function loadFromLocalStorage(): AppSettings {
  try {
    const saved = localStorage.getItem('scxffld:settings')
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<AppSettings>
      return {
        aiApi: { ...defaultSettings.aiApi, ...parsed.aiApi },
        plugins: parsed.plugins ?? defaultSettings.plugins,
        theme: { ...defaultSettings.theme, ...parsed.theme },
        users: parsed.users ?? defaultSettings.users,
        teams: parsed.teams ?? defaultSettings.teams,
        repositories: parsed.repositories ?? defaultSettings.repositories,
      }
    }
  } catch {
    // ignore corrupt data
  }
  return defaultSettings
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    settings: loadFromLocalStorage(),
    open: false,
  } as SettingsState,
  reducers: {
    openSettings(state) {
      state.open = true
    },
    closeSettings(state) {
      state.open = false
    },
    updateAIApi(state, action: PayloadAction<Partial<AIApiSettings>>) {
      state.settings.aiApi = { ...state.settings.aiApi, ...action.payload }
    },
    updateTheme(state, action: PayloadAction<Partial<ThemeSettings>>) {
      state.settings.theme = { ...state.settings.theme, ...action.payload }
    },
    addPlugin(state, action: PayloadAction<Omit<PluginEntry, 'id'>>) {
      state.settings.plugins.push({ id: generateId('plugin'), ...action.payload })
    },
    updatePlugin(state, action: PayloadAction<PluginEntry>) {
      const idx = state.settings.plugins.findIndex((p) => p.id === action.payload.id)
      if (idx !== -1) state.settings.plugins[idx] = action.payload
    },
    removePlugin(state, action: PayloadAction<string>) {
      state.settings.plugins = state.settings.plugins.filter((p) => p.id !== action.payload)
    },
    addUser(state, action: PayloadAction<Omit<UserRecord, 'id'>>) {
      state.settings.users.push({ id: generateId('user'), ...action.payload })
    },
    updateUser(state, action: PayloadAction<UserRecord>) {
      const idx = state.settings.users.findIndex((u) => u.id === action.payload.id)
      if (idx !== -1) state.settings.users[idx] = action.payload
    },
    removeUser(state, action: PayloadAction<string>) {
      state.settings.users = state.settings.users.filter((u) => u.id !== action.payload)
    },
    addTeam(state, action: PayloadAction<Omit<TeamRecord, 'id'>>) {
      state.settings.teams.push({ id: generateId('team'), ...action.payload })
    },
    updateTeam(state, action: PayloadAction<TeamRecord>) {
      const idx = state.settings.teams.findIndex((t) => t.id === action.payload.id)
      if (idx !== -1) state.settings.teams[idx] = action.payload
    },
    removeTeam(state, action: PayloadAction<string>) {
      state.settings.teams = state.settings.teams.filter((t) => t.id !== action.payload)
    },
    addRepository(state, action: PayloadAction<Omit<RepositoryRecord, 'id'>>) {
      state.settings.repositories.push({ id: generateId('repo'), ...action.payload })
    },
    updateRepository(state, action: PayloadAction<RepositoryRecord>) {
      const idx = state.settings.repositories.findIndex((r) => r.id === action.payload.id)
      if (idx !== -1) state.settings.repositories[idx] = action.payload
    },
    removeRepository(state, action: PayloadAction<string>) {
      state.settings.repositories = state.settings.repositories.filter(
        (r) => r.id !== action.payload,
      )
    },
    loadSettingsFromJson(state, action: PayloadAction<AppSettings>) {
      state.settings = action.payload
    },
  },
})

export const {
  openSettings,
  closeSettings,
  updateAIApi,
  updateTheme,
  addPlugin,
  updatePlugin,
  removePlugin,
  addUser,
  updateUser,
  removeUser,
  addTeam,
  updateTeam,
  removeTeam,
  addRepository,
  updateRepository,
  removeRepository,
  loadSettingsFromJson,
} = settingsSlice.actions

export const AVAILABLE_THEMES = [
  { id: 'dark', name: 'Dark' },
  { id: 'light', name: 'Light' },
  { id: 'hc-dark', name: 'High Contrast Dark' },
  { id: 'hc-light', name: 'High Contrast Light' },
  { id: 'unicorn', name: 'Unicorn Poop' },
  { id: 'blue', name: 'Blue' },
  { id: 'purple', name: 'Purple' },
  { id: 'red', name: 'Red' },
]

export default settingsSlice.reducer
