import React from 'react'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { setActivePanel, setActiveTab, removeTab, removePanel } from '../../store/workspaceSlice'
import type { Panel as WorkspacePanel } from '../../store/workspaceSlice'
import ProseMirrorEditor from '../Editor/ProseMirrorEditor'
import DiagramCanvas from '../Diagram/DiagramCanvas'
import Sidebar from '../Sidebar/Sidebar'
import styles from './WorkspaceLayout.module.css'

function TabBar({ panel, showClose }: { panel: WorkspacePanel; showClose: boolean }) {
  const dispatch = useDispatch()
  const activePanelId = useSelector((state: RootState) => state.workspace.activePanelId)
  const isActivePanel = activePanelId === panel.id

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
            title={tab.title}
          >
            <span className={styles.tabTitle}>{tab.title}</span>
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
