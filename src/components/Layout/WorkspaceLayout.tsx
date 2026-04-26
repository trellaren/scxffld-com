import React, { useState, useRef, useEffect } from 'react'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { setActivePanel, setActiveTab, removeTab, removePanel, renameTab } from '../../store/workspaceSlice'
import type { Panel as WorkspacePanel } from '../../store/workspaceSlice'
import ProseMirrorEditor from '../Editor/ProseMirrorEditor'
import DiagramCanvas from '../Diagram/DiagramCanvas'
import Sidebar from '../Sidebar/Sidebar'
import styles from './WorkspaceLayout.module.css'

function TabBar({ panel, showClose }: { panel: WorkspacePanel; showClose: boolean }) {
  const dispatch = useDispatch()
  const activePanelId = useSelector((state: RootState) => state.workspace.activePanelId)
  const isActivePanel = activePanelId === panel.id

  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingTabId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingTabId])

  function handleDoubleClick(e: React.MouseEvent, tabId: string, currentTitle: string) {
    e.stopPropagation()
    setEditingTabId(tabId)
    setEditingTitle(currentTitle)
  }

  function commitRename(tabId: string) {
    const trimmed = editingTitle.trim()
    if (trimmed) {
      dispatch(renameTab({ panelId: panel.id, tabId, title: trimmed }))
    }
    setEditingTabId(null)
  }

  function handleInputKeyDown(e: React.KeyboardEvent, tabId: string) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitRename(tabId)
    } else if (e.key === 'Escape') {
      setEditingTabId(null)
    }
  }

  return (
    <div className={styles.tabBar}>
      <div className={styles.tabBarTabs}>
        {panel.tabs.map((tab) => (
          <div
            key={tab.id}
            className={`${styles.tab} ${isActivePanel && panel.activeTabId === tab.id ? styles.activeTab : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              dispatch(setActiveTab({ panelId: panel.id, tabId: tab.id }))
            }}
            title={editingTabId === tab.id ? undefined : tab.title}
          >
            {editingTabId === tab.id ? (
              <input
                ref={inputRef}
                className={styles.tabTitleInput}
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => commitRename(tab.id)}
                onKeyDown={(e) => handleInputKeyDown(e, tab.id)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className={styles.tabTitle}
                onDoubleClick={(e) => handleDoubleClick(e, tab.id, tab.title)}
              >
                {tab.title}
              </span>
            )}
            <button
              className={styles.tabClose}
              onClick={(e) => {
                e.stopPropagation()
                dispatch(removeTab({ panelId: panel.id, tabId: tab.id }))
              }}
              aria-label={`Close ${tab.title}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {showClose && (
        <button
          className={styles.panelClose}
          onClick={(e) => {
            e.stopPropagation()
            dispatch(removePanel(panel.id))
          }}
          aria-label="Close panel"
          title="Close panel"
        >
          ×
        </button>
      )}
    </div>
  )
}

function ActiveTabContent({ panel }: { panel: WorkspacePanel }) {
  const activeTab = panel.tabs.find((t) => t.id === panel.activeTabId)

  if (!activeTab) {
    return (
      <div className={styles.emptyPanel}>
        <span>No open documents</span>
      </div>
    )
  }

  switch (activeTab.type) {
    case 'editor':
      return <ProseMirrorEditor />
    case 'diagram':
      return <DiagramCanvas />
    default:
      return (
        <div className={styles.emptyPanel}>
          <span>Empty Panel</span>
        </div>
      )
  }
}

export default function WorkspaceLayout() {
  const panels = useSelector((state: RootState) => state.workspace.panels)
  const activePanelId = useSelector((state: RootState) => state.workspace.activePanelId)
  const sidebarOpen = useSelector((state: RootState) => state.workspace.sidebarOpen)
  const splitDirection = useSelector((state: RootState) => state.workspace.splitDirection)
  const dispatch = useDispatch()

  return (
    <PanelGroup direction="horizontal" className={styles.layout}>
      {sidebarOpen && (
        <>
          <Panel defaultSize={18} minSize={12} maxSize={40} className={styles.sidebarPanel}>
            <Sidebar />
          </Panel>
          <PanelResizeHandle className={styles.resizeHandle} />
        </>
      )}
      <Panel defaultSize={sidebarOpen ? 82 : 100} minSize={10} className={styles.contentArea}>
        <PanelGroup direction={splitDirection} className={styles.innerLayout}>
          {panels.map((panel, index) => (
            <React.Fragment key={panel.id}>
              <Panel
                defaultSize={100 / panels.length}
                minSize={10}
                className={`${styles.panel} ${activePanelId === panel.id ? styles.activePanel : ''}`}
                onClick={() => dispatch(setActivePanel(panel.id))}
              >
                <TabBar panel={panel} showClose={panels.length > 1} />
                <div className={styles.panelBody}>
                  <ActiveTabContent panel={panel} />
                </div>
              </Panel>
              {index < panels.length - 1 && (
                <PanelResizeHandle
                  key={`handle-${panel.id}`}
                  className={splitDirection === 'vertical' ? styles.resizeHandleHorizontal : styles.resizeHandle}
                />
              )}
            </React.Fragment>
          ))}
        </PanelGroup>
      </Panel>
    </PanelGroup>
  )
}
