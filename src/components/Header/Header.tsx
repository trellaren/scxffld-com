import { useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { logout } from '../../store/authSlice'
import {
  addPanel,
  addTab,
  splitActiveTab,
  toggleSidebar,
  openFolder,
  closeFolder,
  toggleChat,
  loadProjectFile,
} from '../../store/workspaceSlice'
import type { PanelType, FileEntry } from '../../store/workspaceSlice'
import { toggleTimeline, loadTimeline } from '../../store/timelineSlice'
import type { TimelineItem } from '../../store/timelineSlice'
import { openSettings, updateTheme, AVAILABLE_THEMES } from '../../store/settingsSlice'
import { generateId, downloadProjectFile } from '../../utils'
import { logger } from '../../logger'
import SaveAsDialog from '../SaveAsDialog/SaveAsDialog'
import AiPrompt from './AiPrompt'
import SettingsModal from '../SettingsModal/SettingsModal'
import styles from './Header.module.css'

export default function Header() {
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)
  const activePanelId = useSelector((state: RootState) => state.workspace.activePanelId)
  const rows = useSelector((state: RootState) => state.workspace.rows)
  const panels = rows.flatMap((row) => row.panels)
  const openFolderName = useSelector((state: RootState) => state.workspace.openFolderName)
  const settingsOpen = useSelector((state: RootState) => state.settings.open)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [saveAsOpen, setSaveAsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const projectFileInputRef = useRef<HTMLInputElement>(null)

  const workspaceState = useSelector((state: RootState) => state.workspace)
  const timelineItems = useSelector((state: RootState) => state.timeline.items)

  // Derive the active tab from the active panel
  const activePanel = panels.find((p) => p.id === activePanelId) ?? null
  const activeTab = activePanel?.tabs.find((t) => t.id === activePanel.activeTabId) ?? null

  function openMenu(name: string) {
    setActiveMenu((prev) => (prev === name ? null : name))
    setUserMenuOpen(false)
  }

  function closeAll() {
    setActiveMenu(null)
    setUserMenuOpen(false)
    setMobileMenuOpen(false)
  }

  function handleNewTab(type: PanelType, title?: string) {
    const defaultTitle =
      type === 'editor' ? 'New Text File' :
      type === 'diagram' ? 'New Diagram' :
      type === 'chat' ? 'Chat' :
      type === 'settings' ? 'Settings' :
      type === 'log' ? 'App Log' :
      'Panel'
    const tabTitle = title ?? defaultTitle
    logger.info(`Opening new tab: ${tabTitle} (${type})`)
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

    logger.info(`Opened folder: ${folderName} (${files.length} file${files.length === 1 ? '' : 's'})`)
    dispatch(openFolder({ name: folderName, files: [...folderEntries, ...fileEntries] }))
    e.target.value = ''
  }

  function handleCloseFolder() {
    logger.info('Closed folder')
    dispatch(closeFolder())
    closeAll()
  }

  function handleCloseWindow() {
    window.close()
    closeAll()
  }

  function handleSplitRight() {
    dispatch(splitActiveTab({ direction: 'right', newPanelId: generateId('panel') }))
    closeAll()
  }

  function handleSplitDown() {
    dispatch(splitActiveTab({ direction: 'down', newPanelId: generateId('panel'), newRowId: generateId('row') }))
    closeAll()
  }

  function handleLogout() {
    logger.info('User signed out')
    dispatch(logout())
    closeAll()
  }

  function handleSaveAs() {
    closeAll()
    setSaveAsOpen(true)
  }

  function handleOpenSettings() {
    closeAll()
    dispatch(openSettings())
  }

  function handleViewLog() {
    handleNewTab('log', 'App Log')
    closeAll()
  }

  function handleSaveProjectFile() {
    logger.info('Saving project file')
    closeAll()
    downloadProjectFile(workspaceState, timelineItems)
  }

  function handleOpenProjectFile() {
    closeAll()
    projectFileInputRef.current?.click()
  }

  function handleProjectFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string) as unknown
        if (
          raw !== null &&
          typeof raw === 'object' &&
          'openFolderName' in raw &&
          'openFolderFiles' in raw &&
          typeof (raw as { openFolderName: unknown }).openFolderName === 'string' &&
          Array.isArray((raw as { openFolderFiles: unknown }).openFolderFiles)
        ) {
          const data = raw as { openFolderName: string; openFolderFiles: FileEntry[]; timelineItems?: TimelineItem[] }
          dispatch(loadProjectFile({ openFolderName: data.openFolderName, openFolderFiles: data.openFolderFiles }))
          if (Array.isArray(data.timelineItems)) {
            const validItems = data.timelineItems.filter(
              (item): item is TimelineItem =>
                item !== null &&
                typeof item === 'object' &&
                typeof (item as TimelineItem).id === 'string' &&
                typeof (item as TimelineItem).title === 'string' &&
                typeof (item as TimelineItem).date === 'string' &&
                ((item as TimelineItem).color === undefined || typeof (item as TimelineItem).color === 'string'),
            )
            dispatch(loadTimeline(validItems))
          }
        }
      } catch {
        // ignore invalid JSON
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <>
      {/* Overlay to close menus on outside click */}
      {(activeMenu || userMenuOpen) && (
        <div className={styles.overlay} onClick={closeAll} />
      )}

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <>
          <div className={styles.mobileMenuOverlay} onClick={closeAll} />
          <div className={styles.mobileMenu}>
            <div className={styles.mobileMenuHeader}>
              <span className={styles.mobileMenuTitle}>Menu</span>
              <button className={styles.mobileMenuClose} onClick={closeAll} aria-label="Close menu">
                ✕
              </button>
            </div>

            <div className={styles.mobileMenuSection}>
              <div className={styles.mobileMenuSectionTitle}>File</div>
              <button className={styles.mobileMenuItem} onClick={() => handleNewTab('editor')}>New Text File</button>
              <button className={styles.mobileMenuItem} onClick={() => handleNewTab('diagram')}>New Diagram</button>
              <button className={styles.mobileMenuItem} onClick={() => handleNewTab('chat')}>New Chat</button>
              <button className={styles.mobileMenuItem} onClick={handleOpenFile}>Open File</button>
              <button className={styles.mobileMenuItem} onClick={handleOpenFolder}>Open Folder</button>
              <button
                className={activeTab ? styles.mobileMenuItem : styles.mobileMenuItemDisabled}
                onClick={activeTab ? handleSaveAs : undefined}
              >
                Save As
              </button>
              <button className={styles.mobileMenuItem} onClick={handleSaveProjectFile}>Save Project File</button>
              <button className={styles.mobileMenuItem} onClick={handleOpenProjectFile}>Open Project File</button>
              <button
                className={openFolderName ? styles.mobileMenuItem : styles.mobileMenuItemDisabled}
                onClick={openFolderName ? handleCloseFolder : undefined}
              >
                Close Folder
              </button>
              <button className={styles.mobileMenuItem} onClick={handleOpenSettings}>Settings</button>
            </div>

            <div className={styles.mobileMenuSection}>
              <div className={styles.mobileMenuSectionTitle}>View</div>
              <button className={styles.mobileMenuItem} onClick={() => { dispatch(toggleSidebar()); closeAll() }}>Toggle Sidebar</button>
              <button className={styles.mobileMenuItem} onClick={() => { dispatch(toggleTimeline()); closeAll() }}>Toggle Timeline</button>
              <button className={styles.mobileMenuItem} onClick={() => { dispatch(toggleChat()); closeAll() }}>Toggle Chat</button>
            </div>

            <div className={styles.mobileMenuSection}>
              <div className={styles.mobileMenuSectionTitle}>Help</div>
              <button className={styles.mobileMenuItem} onClick={handleViewLog}>View Log</button>
            </div>

            <div className={styles.mobileMenuSection}>
              <div className={styles.mobileMenuSectionTitle}>Account</div>
              <div className={styles.mobileMenuItemDisabled}>Signed in as {user?.username}</div>
              <button className={styles.mobileMenuItem} onClick={handleLogout}>Sign Out</button>
            </div>
          </div>
        </>
      )}

      {/* Save As dialog */}
      {saveAsOpen && (
        <SaveAsDialog activeTab={activeTab} onClose={() => setSaveAsOpen(false)} />
      )}

      {/* Settings modal */}
      {settingsOpen && <SettingsModal />}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />
      <input
        ref={folderInputRef}
        type="file"
        style={{ display: 'none' }}
        // @ts-expect-error – webkitdirectory is not in React's HTML typedefs but is widely supported
        webkitdirectory=""
        multiple
        onChange={handleFolderInputChange}
      />
      <input
        ref={projectFileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleProjectFileInputChange}
      />

      <header className={styles.header}>
        {/* App name / logo */}
        <div className={styles.appName}>scxffld</div>

        {/* Hamburger button – mobile only */}
        <button
          className={styles.hamburgerButton}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Open menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

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
                <li className={styles.dropdownItem} onClick={() => handleNewTab('chat')}>
                  New Chat
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
                <li className={styles.dropdownItem} onClick={handleSaveProjectFile}>
                  Save All
                </li>
                <li className={styles.dropdownDivider} />
                <li className={styles.dropdownItem} onClick={handleSaveProjectFile}>
                  Save Project File
                </li>
                <li className={styles.dropdownItem} onClick={handleOpenProjectFile}>
                  Open Project File
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
                <li className={styles.dropdownItem} onClick={handleOpenSettings}>
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
                <li className={styles.dropdownItem} onClick={() => { dispatch(toggleChat()); closeAll() }}>
                  Toggle Chat
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
                  Theme ▶
                </li>
                {AVAILABLE_THEMES.map((theme) => (
                  <li
                    key={theme.id}
                    className={styles.dropdownItem}
                    style={{ paddingLeft: 24 }}
                    onClick={() => { logger.info(`Theme changed to: ${theme.name}`); dispatch(updateTheme({ activeTheme: theme.id })); closeAll() }}
                  >
                    {theme.name}
                  </li>
                ))}
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

          {/* Help menu */}
          <div className={styles.menuWrapper}>
            <button
              className={`${styles.menuButton} ${activeMenu === 'help' ? styles.menuButtonActive : ''}`}
              onClick={() => openMenu('help')}
            >
              Help
            </button>
            {activeMenu === 'help' && (
              <ul className={styles.dropdown}>
                <li className={styles.dropdownItem} onClick={handleViewLog}>
                  View Log
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
                <li className={styles.dropdownItem} onClick={handleOpenSettings}>
                  Settings
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
