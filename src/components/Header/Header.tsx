import { useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { logout } from '../../store/authSlice'
import {
  addPanel,
  addPanelToRow,
  addRowWithPanel,
  addTab,
  toggleSidebar,
  openFolder,
  closeFolder,
} from '../../store/workspaceSlice'
import type { PanelType, Panel, PanelRow, FileEntry } from '../../store/workspaceSlice'
import { toggleTimeline } from '../../store/timelineSlice'
import { generateId } from '../../utils'
import SaveAsDialog from '../SaveAsDialog/SaveAsDialog'
import AiPrompt from './AiPrompt'
import styles from './Header.module.css'

export default function Header() {
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)
  const activePanelId = useSelector((state: RootState) => state.workspace.activePanelId)
  const rows = useSelector((state: RootState) => state.workspace.rows)
  const panels = rows.flatMap((row) => row.panels)
  const openFolderName = useSelector((state: RootState) => state.workspace.openFolderName)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [saveAsOpen, setSaveAsOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  // Derive the active tab from the active panel
  const activePanel = panels.find((p) => p.id === activePanelId) ?? null
  const activeTab = activePanel?.tabs.find((t) => t.id === activePanel.activeTabId) ?? null
  const activeRow: PanelRow | null =
    rows.find((row) => row.panels.some((p) => p.id === activePanelId)) ?? null

  function openMenu(name: string) {
    setActiveMenu((prev) => (prev === name ? null : name))
    setUserMenuOpen(false)
  }

  function closeAll() {
    setActiveMenu(null)
    setUserMenuOpen(false)
  }

  function handleNewTab(type: PanelType, title?: string) {
    const defaultTitle = type === 'editor' ? 'New Text File' : type === 'diagram' ? 'New Diagram' : type === 'settings' ? 'Settings' : 'Panel'
    const tabTitle = title ?? defaultTitle
    if (activePanelId) {
      dispatch(
        addTab({
          panelId: activePanelId,
          tab: { id: generateId('tab'), type, title: tabTitle },
        }),
      )
    } else {
      const tabId = generateId('tab')
      dispatch(
        addPanel({
          id: generateId('panel'),
          tabs: [{ id: tabId, type, title: tabTitle }],
          activeTabId: tabId,
        }),
      )
    }
    closeAll()
  }

  function handleNewWindow() {
    window.open(window.location.href, '_blank')
    closeAll()
  }

  function handleOpenFile() {
    closeAll()
    fileInputRef.current?.click()
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    handleNewTab('editor', file.name)
    e.target.value = ''
  }

  function handleOpenFolder() {
    closeAll()
    folderInputRef.current?.click()
  }

  function handleFolderInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    const firstPath = (files[0] as File & { webkitRelativePath: string }).webkitRelativePath
    const folderName = firstPath ? firstPath.split('/')[0] : 'Folder'

    // Build file entries from the selected files
    const fileEntries: FileEntry[] = Array.from(files).map((f) => {
      const relativePath = (f as File & { webkitRelativePath: string }).webkitRelativePath
      return { name: f.name, path: relativePath || f.name, kind: 'file' as const }
    })

    // Synthesize folder entries for every intermediate directory so the
    // sidebar tree mirrors the actual on-disk structure.  webkitdirectory
    // only gives us File objects – no directory entries are included.
    const seenFolderPaths = new Set<string>()
    const folderEntries: FileEntry[] = []
    for (const entry of fileEntries) {
      const parts = entry.path.split('/')
      // parts[0] is the root folder name itself (already represented by
      // openFolderName), so we start synthesising from index 1.
      for (let depth = 1; depth < parts.length - 1; depth++) {
        const folderPath = parts.slice(0, depth + 1).join('/')
        if (!seenFolderPaths.has(folderPath)) {
          seenFolderPaths.add(folderPath)
          folderEntries.push({ name: parts[depth], path: folderPath, kind: 'folder' })
        }
      }
    }

    dispatch(openFolder({ name: folderName, files: [...folderEntries, ...fileEntries] }))
    e.target.value = ''
  }

  function handleCloseFolder() {
    dispatch(closeFolder())
    closeAll()
  }

  function handleCloseWindow() {
    window.close()
    closeAll()
  }

  function handleSplitRight() {
    const tabId = generateId('tab')
    const newPanel: Panel = {
      id: generateId('panel'),
      tabs: [{ id: tabId, type: 'empty', title: 'New Panel' }],
      activeTabId: tabId,
    }
    if (activeRow) {
      dispatch(addPanelToRow({ rowId: activeRow.id, panel: newPanel }))
    } else {
      dispatch(addRowWithPanel({ row: { id: generateId('row'), panels: [newPanel] }, afterRowId: null }))
    }
    closeAll()
  }

  function handleSplitDown() {
    const tabId = generateId('tab')
    const newPanel: Panel = {
      id: generateId('panel'),
      tabs: [{ id: tabId, type: 'empty', title: 'New Panel' }],
      activeTabId: tabId,
    }
    dispatch(
      addRowWithPanel({
        row: { id: generateId('row'), panels: [newPanel] },
        afterRowId: activeRow?.id ?? null,
      }),
    )
    closeAll()
  }

  function handleLogout() {
    dispatch(logout())
    closeAll()
  }

  function handleSaveAs() {
    closeAll()
    setSaveAsOpen(true)
  }

  return (
    <>
      {/* Overlay to close menus on outside click */}
      {(activeMenu || userMenuOpen) && (
        <div className={styles.overlay} onClick={closeAll} />
      )}

      {/* Save As dialog */}
      {saveAsOpen && (
        <SaveAsDialog activeTab={activeTab} onClose={() => setSaveAsOpen(false)} />
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />
      {/* webkitdirectory is supported in all major browsers (Chrome, Firefox 50+, Safari, Edge).
          The @ts-expect-error below suppresses React's missing typedef for this attribute. */}
      <input
        ref={folderInputRef}
        type="file"
        style={{ display: 'none' }}
        // @ts-expect-error – webkitdirectory is not in React's HTML typedefs but is widely supported
        webkitdirectory=""
        multiple
        onChange={handleFolderInputChange}
      />

      <header className={styles.header}>
        {/* App name / logo */}
        <div className={styles.appName}>scxffld</div>

        {/* Navigation menus */}
        <nav className={styles.nav}>
          {/* File menu */}
          <div className={styles.menuWrapper}>
            <button
              className={`${styles.menuButton} ${activeMenu === 'file' ? styles.menuButtonActive : ''}`}
              onClick={() => openMenu('file')}
            >
              File
            </button>
            {activeMenu === 'file' && (
              <ul className={styles.dropdown}>
                <li className={styles.dropdownItem} onClick={() => handleNewTab('editor')}>
                  New Text File
                </li>
                <li className={styles.dropdownItem} onClick={() => handleNewTab('diagram')}>
                  New Diagram
                </li>
                <li className={styles.dropdownDivider} />
                <li className={styles.dropdownItem} onClick={handleNewWindow}>
                  New Window
                </li>
                <li className={styles.dropdownDivider} />
                <li className={styles.dropdownItem} onClick={handleOpenFile}>
                  Open File
                </li>
                <li className={styles.dropdownItem} onClick={handleOpenFolder}>
                  Open Folder
                </li>
                <li className={styles.dropdownDivider} />
                <li className={styles.dropdownItemDisabled}>
                  Save
                </li>
                <li
                  className={activeTab ? styles.dropdownItem : styles.dropdownItemDisabled}
                  onClick={activeTab ? handleSaveAs : undefined}
                >
                  Save As
                </li>
                <li className={styles.dropdownItemDisabled}>
                  Save All
                </li>
                <li className={styles.dropdownDivider} />
                <li
                  className={openFolderName ? styles.dropdownItem : styles.dropdownItemDisabled}
                  onClick={openFolderName ? handleCloseFolder : undefined}
                >
                  Close Folder
                </li>
                <li className={styles.dropdownItem} onClick={handleCloseWindow}>
                  Close Window
                </li>
                <li className={styles.dropdownDivider} />
                <li className={styles.dropdownItem} onClick={() => handleNewTab('settings', 'Settings')}>
                  Settings
                </li>
              </ul>
            )}
          </div>

          {/* View menu */}
          <div className={styles.menuWrapper}>
            <button
              className={`${styles.menuButton} ${activeMenu === 'view' ? styles.menuButtonActive : ''}`}
              onClick={() => openMenu('view')}
            >
              View
            </button>
            {activeMenu === 'view' && (
              <ul className={styles.dropdown}>
                <li className={styles.dropdownItem} onClick={() => { dispatch(toggleSidebar()); closeAll() }}>
                  Toggle Sidebar
                </li>
                <li className={styles.dropdownItem} onClick={() => { dispatch(toggleTimeline()); closeAll() }}>
                  Toggle Timeline
                </li>
                <li className={styles.dropdownDivider} />
                <li className={styles.dropdownItem} onClick={handleSplitRight}>
                  Split Right
                </li>
                <li className={styles.dropdownItem} onClick={handleSplitDown}>
                  Split Down
                </li>
                <li className={styles.dropdownDivider} />
                <li className={styles.dropdownItemDisabled}>
                  Zoom In
                </li>
                <li className={styles.dropdownItemDisabled}>
                  Zoom Out
                </li>
              </ul>
            )}
          </div>
        </nav>

        {/* AI Prompt – center of header */}
        <div className={styles.centerSection}>
          <AiPrompt />
        </div>

        {/* User section */}
        <div className={styles.userSection}>
          <div className={styles.menuWrapper}>
            <button
              className={`${styles.userButton} ${userMenuOpen ? styles.userButtonActive : ''}`}
              onClick={() => {
                setUserMenuOpen((prev) => !prev)
                setActiveMenu(null)
              }}
              aria-label="User menu"
            >
              <span className={styles.avatar}>
                {user?.displayName?.[0]?.toUpperCase() ?? '?'}
              </span>
              <span className={styles.displayName}>{user?.displayName}</span>
            </button>
            {userMenuOpen && (
              <ul className={`${styles.dropdown} ${styles.dropdownRight}`}>
                <li className={styles.dropdownItemDisabled}>
                  Signed in as <strong>{user?.username}</strong>
                </li>
                <li className={styles.dropdownDivider} />
                <li className={styles.dropdownItem} onClick={handleLogout}>
                  Sign Out
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* Window controls (Electron only) */}
        {window.electronAPI && (
          <div className={styles.windowControls}>
            <button
              className={styles.windowControlButton}
              onClick={() => window.electronAPI!.minimizeWindow()}
              aria-label="Minimize"
              title="Minimize"
            >
              &#x2013;
            </button>
            <button
              className={styles.windowControlButton}
              onClick={() => window.electronAPI!.maximizeWindow()}
              aria-label="Maximize"
              title="Maximize"
            >
              &#x2610;
            </button>
            <button
              className={`${styles.windowControlButton} ${styles.windowControlClose}`}
              onClick={() => window.electronAPI!.closeWindow()}
              aria-label="Close"
              title="Close"
            >
              &#x2715;
            </button>
          </div>
        )}
      </header>
    </>
  )
}
