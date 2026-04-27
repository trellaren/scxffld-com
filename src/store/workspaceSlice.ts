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

export interface DiagramData {
  nodes: unknown[]
  edges: unknown[]
}

export interface WorkspaceState {
  panels: Panel[]
  activePanelId: string | null
  sidebarOpen: boolean
  splitDirection: 'horizontal' | 'vertical'
  openFolderName: string | null
  openFolderFiles: FileEntry[]
  diagramData: Record<string, DiagramData>
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
  diagramData: {},
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
    renameTab(state, action: PayloadAction<{ panelId: string; tabId: string; title: string }>) {
      const panel = state.panels.find((p) => p.id === action.payload.panelId)
      if (panel) {
        const tab = panel.tabs.find((t) => t.id === action.payload.tabId)
        if (tab) {
          tab.title = action.payload.title
        }
      }
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
    moveTab(
      state,
      action: PayloadAction<{ tabId: string; sourcePanelId: string; targetPanelId: string }>,
    ) {
      const { tabId, sourcePanelId, targetPanelId } = action.payload
      if (sourcePanelId === targetPanelId) return
      const sourcePanel = state.panels.find((p) => p.id === sourcePanelId)
      const targetPanel = state.panels.find((p) => p.id === targetPanelId)
      if (!sourcePanel || !targetPanel) return
      const tabIdx = sourcePanel.tabs.findIndex((t) => t.id === tabId)
      if (tabIdx === -1) return
      const [tab] = sourcePanel.tabs.splice(tabIdx, 1)
      if (sourcePanel.activeTabId === tabId) {
        sourcePanel.activeTabId =
          sourcePanel.tabs[Math.max(0, tabIdx - 1)]?.id ?? sourcePanel.tabs[0]?.id ?? null
      }
      if (sourcePanel.tabs.length === 0) {
        state.panels = state.panels.filter((p) => p.id !== sourcePanelId)
        if (state.activePanelId === sourcePanelId) {
          state.activePanelId = state.panels[0]?.id ?? null
        }
      }
      targetPanel.tabs.push(tab)
      targetPanel.activeTabId = tab.id
      state.activePanelId = targetPanelId
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
    setDiagramData(state, action: PayloadAction<{ tabId: string; data: DiagramData }>) {
      state.diagramData[action.payload.tabId] = action.payload.data
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
  moveTab,
  renameTab,
  toggleSidebar,
  setSplitDirection,
  openFolder,
  closeFolder,
  setDiagramData,
} = workspaceSlice.actions
export default workspaceSlice.reducer
