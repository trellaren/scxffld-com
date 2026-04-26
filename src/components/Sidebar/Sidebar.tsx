import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { setActiveTab } from '../../store/workspaceSlice'
import type { Tab } from '../../store/workspaceSlice'
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

export default function Sidebar() {
  const dispatch = useDispatch()
  const panels = useSelector((state: RootState) => state.workspace.panels)
  const activePanelId = useSelector((state: RootState) => state.workspace.activePanelId)
  const [projectExpanded, setProjectExpanded] = useState(true)

  const activePanel = panels.find((p) => p.id === activePanelId)

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarTitle}>EXPLORER</div>

      <div className={styles.section}>
        <button
          className={styles.sectionHeader}
          onClick={() => setProjectExpanded((prev) => !prev)}
          aria-expanded={projectExpanded}
        >
          <span className={`${styles.chevron} ${projectExpanded ? styles.chevronOpen : ''}`}>›</span>
          <span className={styles.sectionLabel}>PROJECT</span>
        </button>

        {projectExpanded && (
          <ul className={styles.fileList}>
            {panels.map((panel) =>
              panel.tabs.map((tab) => {
                const isActive =
                  panel.id === activePanelId && tab.id === activePanel?.activeTabId
                return (
                  <li
                    key={`${panel.id}-${tab.id}`}
                    className={`${styles.fileItem} ${isActive ? styles.fileItemActive : ''}`}
                    onClick={() => dispatch(setActiveTab({ panelId: panel.id, tabId: tab.id }))}
                    title={tab.title}
                  >
                    <span className={styles.fileIcon}>{fileIcon(tab.type)}</span>
                    <span className={styles.fileName}>{tab.title}</span>
                  </li>
                )
              }),
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
