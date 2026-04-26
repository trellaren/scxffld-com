import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type PanelType = 'editor' | 'diagram' | 'empty'

export interface Tab {
  id: string
  type: PanelType
  title: string
}

export interface Panel {
  id: string
  tabs: Tab[]
  activeTabId: string | null
}

export interface FileEntry {
  name: string
  path: string
}

export interface WorkspaceState {
  panels: Panel[]
  activePanelId: string | null
  sidebarOpen: boolean
  splitDirection: 'horizontal' | 'vertical'
  openFolderName: string | null
  openFolderFiles: FileEntry[]
}

const initialState: WorkspaceState = {
  panels: [
    {
      id: 'panel-1',
      tabs: [
        { id: 'tab-1', type: 'editor', title: 'Document 1' },
        { id: 'tab-2', type: 'diagram', title: 'Diagram 1' },
      ],
      activeTabId: 'tab-1',
    },
  ],
  activePanelId: 'panel-1',
  sidebarOpen: true,
  splitDirection: 'horizontal',
  openFolderName: null,
  openFolderFiles: [],
}

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setActivePanel(state, action: PayloadAction<string>) {
      state.activePanelId = action.payload
    },
    setActiveTab(state, action: PayloadAction<{ panelId: string; tabId: string }>) {
      const panel = state.panels.find((p) => p.id === action.payload.panelId)
      if (panel) {
        panel.activeTabId = action.payload.tabId
      }
      state.activePanelId = action.payload.panelId
    },
    addPanel(state, action: PayloadAction<Panel>) {
      state.panels.push(action.payload)
      state.activePanelId = action.payload.id
    },
    removePanel(state, action: PayloadAction<string>) {
      state.panels = state.panels.filter((p) => p.id !== action.payload)
      if (state.activePanelId === action.payload) {
        state.activePanelId = state.panels[0]?.id ?? null
      }
    },
    addTab(state, action: PayloadAction<{ panelId: string; tab: Tab }>) {
      const panel = state.panels.find((p) => p.id === action.payload.panelId)
      if (panel) {
        panel.tabs.push(action.payload.tab)
        panel.activeTabId = action.payload.tab.id
      }
      state.activePanelId = action.payload.panelId
    },
    removeTab(state, action: PayloadAction<{ panelId: string; tabId: string }>) {
      const panel = state.panels.find((p) => p.id === action.payload.panelId)
      if (panel) {
        const idx = panel.tabs.findIndex((t) => t.id === action.payload.tabId)
        panel.tabs = panel.tabs.filter((t) => t.id !== action.payload.tabId)
        if (panel.activeTabId === action.payload.tabId) {
          panel.activeTabId =
            panel.tabs[Math.max(0, idx - 1)]?.id ?? panel.tabs[0]?.id ?? null
        }
      }
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSplitDirection(state, action: PayloadAction<'horizontal' | 'vertical'>) {
      state.splitDirection = action.payload
    },
    openFolder(state, action: PayloadAction<{ name: string; files: FileEntry[] }>) {
      state.openFolderName = action.payload.name
      state.openFolderFiles = action.payload.files
    },
    closeFolder(state) {
      state.openFolderName = null
      state.openFolderFiles = []
    },
  },
})

export const {
  setActivePanel,
  setActiveTab,
  addPanel,
  removePanel,
  addTab,
  removeTab,
  toggleSidebar,
  setSplitDirection,
  openFolder,
  closeFolder,
} = workspaceSlice.actions
export default workspaceSlice.reducer
