import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import {
  setActiveTab,
  addTab,
  addPanel,
  removeTab,
  renameTab,
  closeFolder,
  addFolderEntry,
  removeFolderEntry,
  renameFolderEntry,
  setActivePath,
} from '../../store/workspaceSlice'
import type { Tab, FileEntry } from '../../store/workspaceSlice'
import { generateId } from '../../utils'
import ContextMenu from '../ContextMenu/ContextMenu'
import type { ContextMenuEntry } from '../ContextMenu/ContextMenu'
import styles from './Sidebar.module.css'

function fileIcon(type: Tab['type']) {
  switch (type) {
    case 'editor':
      return '📄'
    case 'diagram':
      return '🔷'
    default:
      return '📋'
  }
}

function entryIcon(entry: FileEntry) {
  if (entry.kind === 'folder') return '📁'
  const ext = entry.name.split('.').pop()?.toLowerCase()
  if (ext === 'md' || ext === 'txt' || ext === 'js' || ext === 'ts' || ext === 'tsx' || ext === 'jsx') return '📄'
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'svg' || ext === 'gif') return '🖼️'
  if (ext === 'json' || ext === 'yaml' || ext === 'yml') return '📋'
  return '📄'
}

type ContextMenuState = {
  x: number
  y: number
  items: ContextMenuEntry[]
} | null

type RenamingState =
  | { kind: 'tab'; panelId: string; tabId: string }
  | { kind: 'entry'; path: string }
  | null

export default function Sidebar() {
  const dispatch = useDispatch()
  const panels = useSelector((state: RootState) => state.workspace.panels)
  const activePanelId = useSelector((state: RootState) => state.workspace.activePanelId)
  const openFolderName = useSelector((state: RootState) => state.workspace.openFolderName)
  const openFolderFiles = useSelector((state: RootState) => state.workspace.openFolderFiles)
  const activePath = useSelector((state: RootState) => state.workspace.activePath)

  const [projectExpanded, setProjectExpanded] = useState(true)
  const [folderExpanded, setFolderExpanded] = useState(true)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)
  const [renaming, setRenaming] = useState<RenamingState>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameOriginal, setRenameOriginal] = useState('')

  const activePanel = panels.find((p) => p.id === activePanelId)

  // ── helpers ────────────────────────────────────────────────────────────────

  function openTab(type: Tab['type'], title: string) {
    if (activePanelId) {
      dispatch(addTab({ panelId: activePanelId, tab: { id: generateId('tab'), type, title } }))
    } else {
      const tabId = generateId('tab')
      dispatch(addPanel({ id: generateId('panel'), tabs: [{ id: tabId, type, title }], activeTabId: tabId }))
    }
  }

  function startRenameEntry(path: string, currentName: string) {
    setRenaming({ kind: 'entry', path })
    setRenameValue(currentName)
    setRenameOriginal(currentName)
  }

  function startRenameTab(panelId: string, tabId: string, currentTitle: string) {
    setRenaming({ kind: 'tab', panelId, tabId })
    setRenameValue(currentTitle)
    setRenameOriginal(currentTitle)
  }

  function commitRename() {
    if (!renaming) {
      setRenaming(null)
      return
    }
    const trimmed = renameValue.trim() || renameOriginal
    if (renaming.kind === 'tab') {
      dispatch(renameTab({ panelId: renaming.panelId, tabId: renaming.tabId, title: trimmed }))
    } else {
      dispatch(renameFolderEntry({ path: renaming.path, newName: trimmed }))
    }
    setRenaming(null)
  }

  function showContextMenu(e: React.MouseEvent, items: ContextMenuEntry[]) {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, items })
  }

  function addVirtualEntry(name: string, kind: 'file' | 'folder', parentPath?: string) {
    const effectiveParent = parentPath ?? activePath ?? undefined
    const path = effectiveParent ? `${effectiveParent}/${name}` : name
    const entry: FileEntry = { name, path, kind, virtual: true }
    dispatch(addFolderEntry(entry))
    if (effectiveParent) setExpandedFolders((prev) => new Set([...prev, effectiveParent]))
    startRenameEntry(path, name)
  }

  function toggleFolderExpanded(path: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  function getParentPath(path: string): string | null {
    const lastSlash = path.lastIndexOf('/')
    return lastSlash >= 0 ? path.slice(0, lastSlash) : null
  }

  // ── context menu builders ───────────────────────────────────────────────────

  function handleSidebarContextMenu(e: React.MouseEvent) {
    showContextMenu(e, [
      { label: 'New Text File', onClick: () => openTab('editor', 'Untitled') },
      { label: 'New Diagram', onClick: () => openTab('diagram', 'Untitled Diagram') },
    ])
  }

  function handleEditorsHeaderContextMenu(e: React.MouseEvent) {
    showContextMenu(e, [
      { label: 'New Text File', onClick: () => openTab('editor', 'Untitled') },
      { label: 'New Diagram', onClick: () => openTab('diagram', 'Untitled Diagram') },
    ])
  }

  function handleTabContextMenu(e: React.MouseEvent, panelId: string, tab: Tab) {
    showContextMenu(e, [
      { label: 'Open', onClick: () => dispatch(setActiveTab({ panelId, tabId: tab.id })) },
      { label: 'Rename', onClick: () => startRenameTab(panelId, tab.id, tab.title) },
      'divider',
      { label: 'Close', onClick: () => dispatch(removeTab({ panelId, tabId: tab.id })) },
    ])
  }

  function handleFolderHeaderContextMenu(e: React.MouseEvent) {
    showContextMenu(e, [
      { label: 'New File', onClick: () => addVirtualEntry('Untitled', 'file') },
      { label: 'New Diagram File', onClick: () => addVirtualEntry('Untitled.diagram', 'file') },
      { label: 'New Folder', onClick: () => addVirtualEntry('New Folder', 'folder') },
      'divider',
      { label: 'Close Folder', onClick: () => dispatch(closeFolder()) },
    ])
  }

  function handleEntryContextMenu(e: React.MouseEvent, entry: FileEntry) {
    const items: ContextMenuEntry[] = []
    if (entry.kind === 'folder') {
      items.push({ label: 'New File Inside', onClick: () => addVirtualEntry('Untitled', 'file', entry.path) })
      items.push({ label: 'New Subfolder', onClick: () => addVirtualEntry('New Folder', 'folder', entry.path) })
      items.push('divider')
    } else {
      items.push({ label: 'Open', onClick: () => openTab('editor', entry.name) })
      items.push('divider')
    }
    items.push({ label: 'Rename', onClick: () => startRenameEntry(entry.path, entry.name) })
    items.push({ label: 'Delete', onClick: () => dispatch(removeFolderEntry(entry.path)) })
    showContextMenu(e, items)
  }

  // ── folder tree helpers ─────────────────────────────────────────────────────

  /**
   * Real FS paths look like "folderName/file.txt" (prefixed with openFolderName).
   * Virtual paths look like "file.txt" or "subfolder/file.txt" (no folder prefix).
   * Top-level entries are those whose path-after-root has no further slashes.
   */
  const folderPrefix = openFolderName ? openFolderName + '/' : ''
  const topLevelEntries = openFolderFiles.filter((f) => {
    const rel = f.path.startsWith(folderPrefix) ? f.path.slice(folderPrefix.length) : f.path
    return rel.length > 0 && !rel.includes('/')
  })

  /** Direct children of a folder (by its full stored path) */
  function getChildren(folderPath: string): FileEntry[] {
    return openFolderFiles.filter(
      (f) => f.path.startsWith(folderPath + '/') && !f.path.slice(folderPath.length + 1).includes('/'),
    )
  }

  // ── render helpers ──────────────────────────────────────────────────────────

  function renderRenameInput() {
    return (
      <input
        className={styles.renameInput}
        value={renameValue}
        onChange={(e) => setRenameValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitRename()
          if (e.key === 'Escape') setRenaming(null)
        }}
        onBlur={commitRename}
        autoFocus
        onClick={(e) => e.stopPropagation()}
      />
    )
  }

  function renderFolderEntry(entry: FileEntry, indented = false): React.ReactElement[] {
    const isExpanded = entry.kind === 'folder' && expandedFolders.has(entry.path)
    const isRenaming = renaming?.kind === 'entry' && renaming.path === entry.path

    const row = (
      <li
        key={entry.path}
        className={`${styles.fileItem} ${indented ? styles.fileItemIndented : ''}`}
        onClick={() => {
          if (entry.kind === 'folder') {
            dispatch(setActivePath(entry.path))
            toggleFolderExpanded(entry.path)
          } else {
            dispatch(setActivePath(getParentPath(entry.path)))
            openTab('editor', entry.name)
          }
        }}
        onContextMenu={(e) => handleEntryContextMenu(e, entry)}
        title={entry.path}
      >
        {entry.kind === 'folder' && (
          <span className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}>›</span>
        )}
        <span className={styles.fileIcon}>{entryIcon(entry)}</span>
        {isRenaming ? renderRenameInput() : <span className={styles.fileName}>{entry.name}</span>}
      </li>
    )

    const children: React.ReactElement[] = []
    if (isExpanded) {
      getChildren(entry.path).forEach((child) => {
        children.push(...renderFolderEntry(child, true))
      })
    }

    return [row, ...children]
  }

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className={styles.sidebar} onContextMenu={handleSidebarContextMenu}>
      <div className={styles.sidebarTitle}>EXPLORER</div>

      {openFolderName && (
        <div className={styles.section}>
          <button
            className={styles.sectionHeader}
            onClick={() => setFolderExpanded((prev) => !prev)}
            onContextMenu={handleFolderHeaderContextMenu}
            aria-expanded={folderExpanded}
          >
            <span className={`${styles.chevron} ${folderExpanded ? styles.chevronOpen : ''}`}>›</span>
            <span className={styles.sectionLabel}>{openFolderName.toUpperCase()}</span>
          </button>

          {folderExpanded && (
            <ul className={styles.fileList}>
              {topLevelEntries.flatMap((entry) => renderFolderEntry(entry))}
            </ul>
          )}
        </div>
      )}

      <div className={styles.section}>
        <button
          className={styles.sectionHeader}
          onClick={() => setProjectExpanded((prev) => !prev)}
          onContextMenu={handleEditorsHeaderContextMenu}
          aria-expanded={projectExpanded}
        >
          <span className={`${styles.chevron} ${projectExpanded ? styles.chevronOpen : ''}`}>›</span>
          <span className={styles.sectionLabel}>OPEN EDITORS</span>
        </button>

        {projectExpanded && (
          <ul className={styles.fileList}>
            {panels.map((panel) =>
              panel.tabs.map((tab) => {
                const isActive = panel.id === activePanelId && tab.id === activePanel?.activeTabId
                const isRenaming = renaming?.kind === 'tab' && renaming.tabId === tab.id
                return (
                  <li
                    key={`${panel.id}-${tab.id}`}
                    className={`${styles.fileItem} ${isActive ? styles.fileItemActive : ''}`}
                    onClick={() => dispatch(setActiveTab({ panelId: panel.id, tabId: tab.id }))}
                    onContextMenu={(e) => handleTabContextMenu(e, panel.id, tab)}
                    title={tab.title}
                  >
                    <span className={styles.fileIcon}>{fileIcon(tab.type)}</span>
                    {isRenaming ? (
                      renderRenameInput()
                    ) : (
                      <span className={styles.fileName}>{tab.title}</span>
                    )}
                  </li>
                )
              }),
            )}
          </ul>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}

