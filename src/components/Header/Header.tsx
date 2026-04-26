import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { logout } from '../../store/authSlice'
import { addPanel, toggleSidebar } from '../../store/workspaceSlice'
import type { PanelType } from '../../store/workspaceSlice'
import styles from './Header.module.css'

function generateId() {
  return `panel-${Date.now()}`
}

export default function Header() {
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  function openMenu(name: string) {
    setActiveMenu((prev) => (prev === name ? null : name))
    setUserMenuOpen(false)
  }

  function closeAll() {
    setActiveMenu(null)
    setUserMenuOpen(false)
  }

  function handleNewPanel(type: PanelType) {
    dispatch(
      addPanel({
        id: generateId(),
        type,
        title: type === 'editor' ? 'New Document' : type === 'diagram' ? 'New Diagram' : 'Panel',
      }),
    )
    closeAll()
  }

  function handleLogout() {
    dispatch(logout())
    closeAll()
  }

  return (
    <>
      {/* Overlay to close menus on outside click */}
      {(activeMenu || userMenuOpen) && (
        <div className={styles.overlay} onClick={closeAll} />
      )}

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
                <li className={styles.dropdownItem} onClick={() => handleNewPanel('editor')}>
                  New Document
                </li>
                <li className={styles.dropdownItem} onClick={() => handleNewPanel('diagram')}>
                  New Diagram
                </li>
                <li className={styles.dropdownItem} onClick={() => handleNewPanel('empty')}>
                  New Empty Panel
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
                <li className={styles.dropdownItem} onClick={closeAll}>
                  Zoom In
                </li>
                <li className={styles.dropdownItem} onClick={closeAll}>
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
