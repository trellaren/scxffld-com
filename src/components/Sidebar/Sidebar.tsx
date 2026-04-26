import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { setActivePanel } from '../../store/workspaceSlice'
import type { Panel } from '../../store/workspaceSlice'
import styles from './Sidebar.module.css'

function fileIcon(type: Panel['type']) {
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
            {panels.map((panel) => (
              <li
                key={panel.id}
                className={`${styles.fileItem} ${activePanelId === panel.id ? styles.fileItemActive : ''}`}
                onClick={() => dispatch(setActivePanel(panel.id))}
                title={panel.title}
              >
                <span className={styles.fileIcon}>{fileIcon(panel.type)}</span>
                <span className={styles.fileName}>{panel.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
