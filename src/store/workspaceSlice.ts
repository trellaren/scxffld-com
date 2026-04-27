import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type PanelType = 'editor' | 'diagram' | 'empty' | 'settings' | 'chat' | 'log' | 'projects' | 'json'

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

export interface PanelRow {
  id: string
  panels: Panel[]
}

export interface FileEntry {
  name: string
  path: string
  kind?: 'file' | 'folder'
  virtual?: boolean
}

export interface DiagramData {
  nodes: unknown[]
  edges: unknown[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

export interface WorkspaceState {
  rows: PanelRow[]
  activePanelId: string | null
  sidebarOpen: boolean
  openFolderName: string | null
  openFolderFiles: FileEntry[]
  activePath: string | null
  diagramData: Record<string, DiagramData>
  chatOpen: boolean
  chatMessages: Record<string, ChatMessage[]>
  chatSending: boolean
  fileContents: Record<string, string>
}

const initialState: WorkspaceState = {
  rows: [
    {
      id: 'row-1',
      panels: [
        {
          id: 'panel-1',
          tabs: [
            { id: 'tab-1', type: 'chat', title: 'Chat' },
            { id: 'tab-2', type: 'projects', title: 'Projects' },
          ],
          activeTabId: 'tab-1',
        },
      ],
    },
  ],
  activePanelId: 'panel-1',
  sidebarOpen: true,
  openFolderName: null,
  openFolderFiles: [],
  activePath: null,
  diagramData: {},
  chatOpen: false,
  chatMessages: {},
  chatSending: false,
  fileContents: {},
}

function findPanel(rows: PanelRow[], panelId: string): Panel | undefined {
  for (const row of rows) {
    const panel = row.panels.find((p) => p.id === panelId)
    if (panel) return panel
  }
  return undefined
}

function findRowByPanelId(rows: PanelRow[], panelId: string): PanelRow | undefined {
  return rows.find((row) => row.panels.some((p) => p.id === panelId))
}

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setActivePanel(state, action: PayloadAction<string>) {
      state.activePanelId = action.payload
    },
    setActiveTab(state, action: PayloadAction<{ panelId: string; tabId: string }>) {
      const panel = findPanel(state.rows, action.payload.panelId)
      if (panel) {
        panel.activeTabId = action.payload.tabId
      }
      state.activePanelId = action.payload.panelId
    },
    addPanel(state, action: PayloadAction<Panel>) {
      // Add to the row containing the active panel, or to the first row,
      // or create a new row if none exist.
      if (state.activePanelId) {
        const row = findRowByPanelId(state.rows, state.activePanelId)
        if (row) {
          row.panels.push(action.payload)
          state.activePanelId = action.payload.id
          return
        }
      }
      if (state.rows.length > 0) {
        state.rows[0].panels.push(action.payload)
      } else {
        state.rows.push({ id: `row-${Date.now()}`, panels: [action.payload] })
      }
      state.activePanelId = action.payload.id
    },
    addPanelToRow(state, action: PayloadAction<{ rowId: string; panel: Panel }>) {
      const row = state.rows.find((r) => r.id === action.payload.rowId)
      if (row) {
        row.panels.push(action.payload.panel)
        state.activePanelId = action.payload.panel.id
      }
    },
    addRowWithPanel(state, action: PayloadAction<{ row: PanelRow; afterRowId: string | null }>) {
      const { row, afterRowId } = action.payload
      if (afterRowId) {
        const idx = state.rows.findIndex((r) => r.id === afterRowId)
        if (idx >= 0) {
          state.rows.splice(idx + 1, 0, row)
        } else {
          state.rows.push(row)
        }
      } else {
        state.rows.push(row)
      }
      const firstPanel = row.panels[0]
      if (firstPanel) {
        state.activePanelId = firstPanel.id
      }
    },
    removePanel(state, action: PayloadAction<string>) {
      const rowIdx = state.rows.findIndex((row) => row.panels.some((p) => p.id === action.payload))
      if (rowIdx === -1) return
      const row = state.rows[rowIdx]
      row.panels = row.panels.filter((p) => p.id !== action.payload)
      if (row.panels.length === 0) {
        state.rows.splice(rowIdx, 1)
      }
      if (state.activePanelId === action.payload) {
        state.activePanelId = state.rows[0]?.panels[0]?.id ?? null
      }
    },
    addTab(state, action: PayloadAction<{ panelId: string; tab: Tab }>) {
      const panel = findPanel(state.rows, action.payload.panelId)
      if (panel) {
        panel.tabs.push(action.payload.tab)
        panel.activeTabId = action.payload.tab.id
      }
      state.activePanelId = action.payload.panelId
    },
    renameTab(state, action: PayloadAction<{ panelId: string; tabId: string; title: string }>) {
      const panel = findPanel(state.rows, action.payload.panelId)
      if (panel) {
        const tab = panel.tabs.find((t) => t.id === action.payload.tabId)
        if (tab) {
          tab.title = action.payload.title
        }
      }
    },
    removeTab(state, action: PayloadAction<{ panelId: string; tabId: string }>) {
      const panel = findPanel(state.rows, action.payload.panelId)
      if (panel) {
        const idx = panel.tabs.findIndex((t) => t.id === action.payload.tabId)
        panel.tabs = panel.tabs.filter((t) => t.id !== action.payload.tabId)
        if (panel.activeTabId === action.payload.tabId) {
          panel.activeTabId =
            panel.tabs[Math.max(0, idx - 1)]?.id ?? panel.tabs[0]?.id ?? null
        }
      }
      // Clean up any persisted chat messages for this tab
      delete state.chatMessages[action.payload.tabId]
      // Clean up any stored file content for this tab
      delete state.fileContents[action.payload.tabId]
    },
    moveTab(
      state,
      action: PayloadAction<{ tabId: string; sourcePanelId: string; targetPanelId: string }>,
    ) {
      const { tabId, sourcePanelId, targetPanelId } = action.payload
      if (sourcePanelId === targetPanelId) return
      const sourcePanel = findPanel(state.rows, sourcePanelId)
      const targetPanel = findPanel(state.rows, targetPanelId)
      if (!sourcePanel || !targetPanel) return
      const tabIdx = sourcePanel.tabs.findIndex((t) => t.id === tabId)
      if (tabIdx === -1) return
      const [tab] = sourcePanel.tabs.splice(tabIdx, 1)
      if (sourcePanel.activeTabId === tabId) {
        sourcePanel.activeTabId =
          sourcePanel.tabs[Math.max(0, tabIdx - 1)]?.id ?? sourcePanel.tabs[0]?.id ?? null
      }
      if (sourcePanel.tabs.length === 0) {
        const rowIdx = state.rows.findIndex((row) =>
          row.panels.some((p) => p.id === sourcePanelId),
        )
        if (rowIdx >= 0) {
          state.rows[rowIdx].panels = state.rows[rowIdx].panels.filter(
            (p) => p.id !== sourcePanelId,
          )
          if (state.rows[rowIdx].panels.length === 0) {
            state.rows.splice(rowIdx, 1)
          }
        }
        if (state.activePanelId === sourcePanelId) {
          state.activePanelId = state.rows[0]?.panels[0]?.id ?? null
        }
      }
      targetPanel.tabs.push(tab)
      targetPanel.activeTabId = tab.id
      state.activePanelId = targetPanelId
    },
    /**
     * Split the active tab into a new panel in the given direction.
     * The active tab is moved out of the current panel and placed in a
     * freshly-created panel to the right (same row) or below (new row).
     */
    splitActiveTab(
      state,
      action: PayloadAction<{ direction: 'right' | 'down'; newPanelId: string; newRowId?: string }>,
    ) {
      const { direction, newPanelId, newRowId } = action.payload
      if (!state.activePanelId) return

      const activePanel = findPanel(state.rows, state.activePanelId)
      if (!activePanel || !activePanel.activeTabId) return

      const tabIdx = activePanel.tabs.findIndex((t) => t.id === activePanel.activeTabId)
      if (tabIdx === -1) return

      // Remove the active tab from the current panel
      const [tab] = activePanel.tabs.splice(tabIdx, 1)
      activePanel.activeTabId =
        activePanel.tabs[Math.max(0, tabIdx - 1)]?.id ?? activePanel.tabs[0]?.id ?? null

      const newPanel: Panel = { id: newPanelId, tabs: [tab], activeTabId: tab.id }
      const activePanelId = state.activePanelId

      if (direction === 'right') {
        const row = findRowByPanelId(state.rows, activePanelId)
        if (!row) return
        const panelIdx = row.panels.findIndex((p) => p.id === activePanelId)
        if (activePanel.tabs.length === 0) {
          // Replace the now-empty source panel in-place
          row.panels.splice(panelIdx, 1, newPanel)
        } else {
          row.panels.splice(panelIdx + 1, 0, newPanel)
        }
      } else {
        // direction === 'down'
        const rowIdx = state.rows.findIndex((r) => r.panels.some((p) => p.id === activePanelId))
        if (rowIdx === -1) return
        const id = newRowId ?? `row-${Date.now()}`
        const currentRow = state.rows[rowIdx]
        if (activePanel.tabs.length === 0) {
          currentRow.panels = currentRow.panels.filter((p) => p.id !== activePanelId)
          if (currentRow.panels.length === 0) {
            state.rows.splice(rowIdx, 1, { id, panels: [newPanel] })
          } else {
            state.rows.splice(rowIdx + 1, 0, { id, panels: [newPanel] })
          }
        } else {
          state.rows.splice(rowIdx + 1, 0, { id, panels: [newPanel] })
        }
      }
      state.activePanelId = newPanelId
    },
    /**
     * Move a dragged tab onto the edge of a target panel, creating a new
     * split panel.  Edges 'left'/'right' add a panel to the target's row;
     * 'top'/'bottom' add a new row adjacent to the target's row.
     */
    moveTabToSplit(
      state,
      action: PayloadAction<{
        tabId: string
        sourcePanelId: string
        targetPanelId: string
        edge: 'left' | 'right' | 'top' | 'bottom'
        newPanelId: string
        newRowId?: string
      }>,
    ) {
      const { tabId, sourcePanelId, targetPanelId, edge, newPanelId, newRowId } = action.payload

      const sourcePanel = findPanel(state.rows, sourcePanelId)
      if (!sourcePanel) return

      const tabIdx = sourcePanel.tabs.findIndex((t) => t.id === tabId)
      if (tabIdx === -1) return

      // Remember target position before any structural changes
      let targetRowIdx = state.rows.findIndex((r) => r.panels.some((p) => p.id === targetPanelId))
      if (targetRowIdx === -1) return
      let targetPanelIdx = state.rows[targetRowIdx].panels.findIndex((p) => p.id === targetPanelId)

      const sourceRowIdx = state.rows.findIndex((r) => r.panels.some((p) => p.id === sourcePanelId))
      const sourceRow = state.rows[sourceRowIdx]
      const sourcePanelIdx = sourceRow.panels.findIndex((p) => p.id === sourcePanelId)

      // Remove tab from source panel
      const [tab] = sourcePanel.tabs.splice(tabIdx, 1)
      if (sourcePanel.activeTabId === tabId) {
        sourcePanel.activeTabId =
          sourcePanel.tabs[Math.max(0, tabIdx - 1)]?.id ?? sourcePanel.tabs[0]?.id ?? null
      }

      // Clean up empty source panel
      if (sourcePanel.tabs.length === 0) {
        if (sourcePanelId === targetPanelId) {
          // Degenerate case: the only tab in a panel was dragged to the panel's own
          // edge.  Replace the now-empty panel with the new one in-place (left/right)
          // or remove it and create a new row (top/bottom).
          const newPanel: Panel = { id: newPanelId, tabs: [tab], activeTabId: tab.id }
          const rowId = newRowId ?? `row-${Date.now()}`
          const targetRow = state.rows[targetRowIdx]
          if (edge === 'left' || edge === 'right') {
            targetRow.panels.splice(targetPanelIdx, 1, newPanel)
          } else {
            targetRow.panels.splice(targetPanelIdx, 1)
            if (targetRow.panels.length === 0) {
              state.rows.splice(targetRowIdx, 1, { id: rowId, panels: [newPanel] })
            } else if (edge === 'top') {
              state.rows.splice(targetRowIdx, 0, { id: rowId, panels: [newPanel] })
            } else {
              state.rows.splice(targetRowIdx + 1, 0, { id: rowId, panels: [newPanel] })
            }
          }
          state.activePanelId = newPanelId
          return
        }
        sourceRow.panels.splice(sourcePanelIdx, 1)
        if (sourceRow.panels.length === 0) {
          state.rows.splice(sourceRowIdx, 1)
          if (sourceRowIdx < targetRowIdx) targetRowIdx -= 1
        } else if (sourceRowIdx === targetRowIdx && sourcePanelIdx < targetPanelIdx) {
          targetPanelIdx -= 1
        }
        if (state.activePanelId === sourcePanelId) {
          state.activePanelId = state.rows[0]?.panels[0]?.id ?? null
        }
      }

      const targetRow = state.rows[targetRowIdx]
      if (!targetRow) return

      const newPanel: Panel = { id: newPanelId, tabs: [tab], activeTabId: tab.id }
      const rowId = newRowId ?? `row-${Date.now()}`

      if (edge === 'left') {
        targetRow.panels.splice(targetPanelIdx, 0, newPanel)
      } else if (edge === 'right') {
        targetRow.panels.splice(targetPanelIdx + 1, 0, newPanel)
      } else if (edge === 'top') {
        state.rows.splice(targetRowIdx, 0, { id: rowId, panels: [newPanel] })
      } else {
        // 'bottom'
        state.rows.splice(targetRowIdx + 1, 0, { id: rowId, panels: [newPanel] })
      }

      state.activePanelId = newPanelId
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen
    },
    openFolder(state, action: PayloadAction<{ name: string; files: FileEntry[] }>) {
      state.openFolderName = action.payload.name
      state.openFolderFiles = action.payload.files
    },
    closeFolder(state) {
      state.openFolderName = null
      state.openFolderFiles = []
      state.activePath = null
    },
    addFolderEntry(state, action: PayloadAction<FileEntry>) {
      state.openFolderFiles.push(action.payload)
    },
    removeFolderEntry(state, action: PayloadAction<string>) {
      const path = action.payload
      // Remove the entry and any children (entries whose path starts with path + '/')
      state.openFolderFiles = state.openFolderFiles.filter(
        (f) => f.path !== path && !f.path.startsWith(path + '/'),
      )
    },
    renameFolderEntry(
      state,
      action: PayloadAction<{ path: string; newName: string }>,
    ) {
      const { path, newName } = action.payload
      const entry = state.openFolderFiles.find((f) => f.path === path)
      if (!entry) return
      const lastSlash = entry.path.lastIndexOf('/')
      const newPath = lastSlash >= 0 ? entry.path.slice(0, lastSlash + 1) + newName : newName
      const oldPath = entry.path
      entry.name = newName
      entry.path = newPath
      // Update children paths when renaming a folder
      if (entry.kind === 'folder') {
        state.openFolderFiles
          .filter((f) => f.path.startsWith(oldPath + '/'))
          .forEach((child) => {
            child.path = newPath + child.path.slice(oldPath.length)
          })
      }
    },
    setActivePath(state, action: PayloadAction<string | null>) {
      state.activePath = action.payload
    },
    setDiagramData(state, action: PayloadAction<{ tabId: string; data: DiagramData }>) {
      state.diagramData[action.payload.tabId] = action.payload.data
    },
    setChatMessages(
      state,
      action: PayloadAction<{ sessionId: string; messages: ChatMessage[] }>,
    ) {
      state.chatMessages[action.payload.sessionId] = action.payload.messages
    },
    clearChatMessages(state, action: PayloadAction<string>) {
      delete state.chatMessages[action.payload]
    },
    setChatSending(state, action: PayloadAction<boolean>) {
      state.chatSending = action.payload
    },
    toggleChat(state) {
      state.chatOpen = !state.chatOpen
    },
    loadProjectFile(state, action: PayloadAction<{ openFolderName: string; openFolderFiles: FileEntry[] }>) {
      state.openFolderName = action.payload.openFolderName
      state.openFolderFiles = action.payload.openFolderFiles
    },
    setFileContent(state, action: PayloadAction<{ tabId: string; content: string }>) {
      state.fileContents[action.payload.tabId] = action.payload.content
    },
  },
})

export const {
  setActivePanel,
  setActiveTab,
  addPanel,
  addPanelToRow,
  addRowWithPanel,
  removePanel,
  addTab,
  removeTab,
  moveTab,
  splitActiveTab,
  moveTabToSplit,
  renameTab,
  toggleSidebar,
  openFolder,
  closeFolder,
  addFolderEntry,
  removeFolderEntry,
  renameFolderEntry,
  setActivePath,
  setDiagramData,
  setChatMessages,
  clearChatMessages,
  setChatSending,
  toggleChat,
  loadProjectFile,
  setFileContent,
} = workspaceSlice.actions
export default workspaceSlice.reducer
