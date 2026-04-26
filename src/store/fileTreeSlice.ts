import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  expanded?: boolean
}

export interface FileTreeState {
  root: FileNode[]
  selectedId: string | null
}

const initialState: FileTreeState = {
  root: [
    {
      id: 'folder-1',
      name: 'Documents',
      type: 'folder',
      expanded: true,
      children: [
        { id: 'file-1', name: 'README.md', type: 'file' },
        { id: 'file-2', name: 'notes.txt', type: 'file' },
      ],
    },
    {
      id: 'folder-2',
      name: 'Diagrams',
      type: 'folder',
      expanded: false,
      children: [
        { id: 'file-3', name: 'architecture.diagram', type: 'file' },
      ],
    },
    { id: 'file-4', name: 'project.json', type: 'file' },
  ],
  selectedId: null,
}

function findNode(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

function removeNode(nodes: FileNode[], id: string): FileNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => ({
      ...n,
      children: n.children ? removeNode(n.children, id) : undefined,
    }))
}

function generateId() {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

const fileTreeSlice = createSlice({
  name: 'fileTree',
  initialState,
  reducers: {
    selectNode(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload
    },
    toggleFolder(state, action: PayloadAction<string>) {
      const node = findNode(state.root, action.payload)
      if (node && node.type === 'folder') {
        node.expanded = !node.expanded
      }
    },
    addFile(state, action: PayloadAction<{ parentId: string | null; name: string }>) {
      const newFile: FileNode = {
        id: generateId(),
        name: action.payload.name,
        type: 'file',
      }
      if (action.payload.parentId === null) {
        state.root.push(newFile)
      } else {
        const parent = findNode(state.root, action.payload.parentId)
        if (parent && parent.type === 'folder') {
          parent.children = parent.children ?? []
          parent.children.push(newFile)
          parent.expanded = true
        }
      }
    },
    addFolder(state, action: PayloadAction<{ parentId: string | null; name: string }>) {
      const newFolder: FileNode = {
        id: generateId(),
        name: action.payload.name,
        type: 'folder',
        expanded: true,
        children: [],
      }
      if (action.payload.parentId === null) {
        state.root.push(newFolder)
      } else {
        const parent = findNode(state.root, action.payload.parentId)
        if (parent && parent.type === 'folder') {
          parent.children = parent.children ?? []
          parent.children.push(newFolder)
          parent.expanded = true
        }
      }
    },
    renameNode(state, action: PayloadAction<{ id: string; name: string }>) {
      const node = findNode(state.root, action.payload.id)
      if (node) {
        node.name = action.payload.name
      }
    },
    deleteNode(state, action: PayloadAction<string>) {
      state.root = removeNode(state.root, action.payload)
      if (state.selectedId === action.payload) {
        state.selectedId = null
      }
    },
  },
})

export const { selectNode, toggleFolder, addFile, addFolder, renameNode, deleteNode } =
  fileTreeSlice.actions
export default fileTreeSlice.reducer
