export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

import type { WorkspaceState, FileEntry } from './store/workspaceSlice'
import type { TimelineItem } from './store/timelineSlice'

export function downloadProjectFile(state: WorkspaceState, timelineItems: TimelineItem[]): void {
  const data = {
    openFolderName: state.openFolderName,
    openFolderFiles: state.openFolderFiles,
    timelineItems,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'projectFile.json'
  a.click()
  URL.revokeObjectURL(url)
}

export type { FileEntry }
