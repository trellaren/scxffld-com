import { useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { logout } from '../../store/authSlice'
import {
  addPanel,
  addTab,
  toggleSidebar,
  setSplitDirection,
  openFolder,
  closeFolder,
} from '../../store/workspaceSlice'
import type { PanelType, FileEntry } from '../../store/workspaceSlice'
import { toggleTimeline } from '../../store/timelineSlice'
import { generateId } from '../../utils'
import SaveAsDialog from '../SaveAsDialog/SaveAsDialog'
import styles from './Header.module.css'

export default function Header() {
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)
  const activePanelId = useSelector((state: RootState) => state.workspace.activePanelId)
  const panels = useSelector((state: RootState) => state.workspace.panels)
  const openFolderName = useSelector((state: RootState) => state.workspace.openFolderName)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [saveAsOpen, setSaveAsOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

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
  }

  function handleNewTab(type: PanelType, title?: string) {
    const defaultTitle = type === 'editor' ? 'New Text File' : type === 'diagram' ? 'New Diagram' : 'Panel'
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
    const entries: FileEntry[] = Array.from(files).map((f) => {
      const relativePath = (f as File & { webkitRelativePath: string }).webkitRelativePath
      return { name: f.name, path: relativePath || f.name }
    })
    dispatch(openFolder({ name: folderName, files: entries }))
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
    dispatch(setSplitDirection('horizontal'))
    dispatch(
      addPanel({
        id: generateId('panel'),
        tabs: [{ id: tabId, type: 'empty', title: 'New Panel' }],
        activeTabId: tabId,
      }),
    )
    closeAll()
  }

  function handleSplitDown() {
    const tabId = generateId('tab')
    dispatch(setSplitDirection('vertical'))
    dispatch(
      addPanel({
        id: generateId('panel'),
        tabs: [{ id: tabId, type: 'empty', title: 'New Panel' }],
        activeTabId: tabId,
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
                <li className={styles.dropdownItem} onClick={() => handleNewTab('empty', 'Settings')}>
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
      </header>
    </>
  )
}
