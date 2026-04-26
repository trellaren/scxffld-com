import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { setActiveTab, addTab, addPanel } from '../../store/workspaceSlice'
import type { Tab } from '../../store/workspaceSlice'
import { generateId } from '../../utils'
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

function folderFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'md' || ext === 'txt' || ext === 'js' || ext === 'ts' || ext === 'tsx' || ext === 'jsx') return '📄'
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'svg' || ext === 'gif') return '🖼️'
  if (ext === 'json' || ext === 'yaml' || ext === 'yml') return '📋'
  return '📄'
}

export default function Sidebar() {
  const dispatch = useDispatch()
  const panels = useSelector((state: RootState) => state.workspace.panels)
  const activePanelId = useSelector((state: RootState) => state.workspace.activePanelId)
  const openFolderName = useSelector((state: RootState) => state.workspace.openFolderName)
  const openFolderFiles = useSelector((state: RootState) => state.workspace.openFolderFiles)
  const [projectExpanded, setProjectExpanded] = useState(true)
  const [folderExpanded, setFolderExpanded] = useState(true)

  const activePanel = panels.find((p) => p.id === activePanelId)

  function handleOpenFolderFile(name: string) {
    if (activePanelId) {
      dispatch(
        addTab({
          panelId: activePanelId,
          tab: { id: generateId('tab'), type: 'editor', title: name },
        }),
      )
    } else {
      const tabId = generateId('tab')
      dispatch(
        addPanel({
          id: generateId('panel'),
          tabs: [{ id: tabId, type: 'editor', title: name }],
          activeTabId: tabId,
        }),
      )
    }
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarTitle}>EXPLORER</div>

      {openFolderName && (
        <div className={styles.section}>
          <button
            className={styles.sectionHeader}
            onClick={() => setFolderExpanded((prev) => !prev)}
            aria-expanded={folderExpanded}
          >
            <span className={`${styles.chevron} ${folderExpanded ? styles.chevronOpen : ''}`}>›</span>
            <span className={styles.sectionLabel}>{openFolderName.toUpperCase()}</span>
          </button>

          {folderExpanded && (
            <ul className={styles.fileList}>
              {openFolderFiles.map((entry) => (
                <li
                  key={entry.path}
                  className={styles.fileItem}
                  onClick={() => handleOpenFolderFile(entry.name)}
                  title={entry.path}
                >
                  <span className={styles.fileIcon}>{folderFileIcon(entry.name)}</span>
                  <span className={styles.fileName}>{entry.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className={styles.section}>
        <button
          className={styles.sectionHeader}
          onClick={() => setProjectExpanded((prev) => !prev)}
          aria-expanded={projectExpanded}
        >
          <span className={`${styles.chevron} ${projectExpanded ? styles.chevronOpen : ''}`}>›</span>
          <span className={styles.sectionLabel}>OPEN EDITORS</span>
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
