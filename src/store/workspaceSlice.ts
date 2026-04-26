import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type PanelType = 'editor' | 'diagram' | 'empty'

export interface Panel {
  id: string
  type: PanelType
  title: string
}

export interface WorkspaceState {
  panels: Panel[]
  activePanelId: string | null
}

const initialState: WorkspaceState = {
  panels: [
    { id: 'panel-1', type: 'editor', title: 'Document 1' },
    { id: 'panel-2', type: 'diagram', title: 'Diagram 1' },
  ],
  activePanelId: 'panel-1',
}

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setActivePanel(state, action: PayloadAction<string>) {
      state.activePanelId = action.payload
    },
    addPanel(state, action: PayloadAction<Panel>) {
      state.panels.push(action.payload)
    },
    removePanel(state, action: PayloadAction<string>) {
      state.panels = state.panels.filter((p) => p.id !== action.payload)
      if (state.activePanelId === action.payload) {
        state.activePanelId = state.panels[0]?.id ?? null
      }
    },
    updatePanelType(state, action: PayloadAction<{ id: string; type: PanelType }>) {
      const panel = state.panels.find((p) => p.id === action.payload.id)
      if (panel) {
        panel.type = action.payload.type
      }
    },
  },
})

export const { setActivePanel, addPanel, removePanel, updatePanelType } = workspaceSlice.actions
export default workspaceSlice.reducer
