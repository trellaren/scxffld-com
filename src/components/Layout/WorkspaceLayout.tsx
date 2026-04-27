import React, { useState, useRef, useEffect, useContext, createContext } from 'react'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { setActivePanel, setActiveTab, removeTab, removePanel, renameTab, moveTab, moveTabToSplit, toggleSidebar, toggleChat, addTab } from '../../store/workspaceSlice'
import type { Panel as WorkspacePanel, PanelType } from '../../store/workspaceSlice'
import ProseMirrorEditor from '../Editor/ProseMirrorEditor'
import DiagramCanvas from '../Diagram/DiagramCanvas'
import Settings from '../Settings/Settings'
import ChatPane from '../Chat/ChatPane'
import LogViewer from '../LogViewer/LogViewer'
import Sidebar from '../Sidebar/Sidebar'
import { useIsMobile } from '../../hooks/useIsMobile'
import { generateId } from '../../utils'
import styles from './WorkspaceLayout.module.css'

interface TabDragState {
  isDraggingTab: boolean
  startDrag: (tabId: string, sourcePanelId: string) => void
  endDrag: () => void
  dragData: { tabId: string; sourcePanelId: string } | null
}

const TabDragContext = createContext<TabDragState>({
  isDraggingTab: false,
  startDrag: () => {},
  endDrag: () => {},
  dragData: null,
})

const TAB_DEFAULT_TITLES: Record<string, string> = {
  chat: 'Chat',
  editor: 'New Text File',
  diagram: 'New Diagram',
  settings: 'Settings',
  log: 'App Log',
}

function TabBar({ panel, showClose }: { panel: WorkspacePanel; showClose: boolean }) {
  const dispatch = useDispatch()
  const activePanelId = useSelector((state: RootState) => state.workspace.activePanelId)
  const isActivePanel = activePanelId === panel.id

  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { startDrag, endDrag } = useContext(TabDragContext)

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

  function handleDragStart(e: React.DragEvent, tabId: string) {
    e.dataTransfer.setData(
      'application/x-tab-drag',
      JSON.stringify({ tabId, sourcePanelId: panel.id }),
    )
    e.dataTransfer.effectAllowed = 'move'
    startDrag(tabId, panel.id)
  }

  function handleDragEnd() {
    endDrag()
  }

  function handleDragOver(e: React.DragEvent) {
    if (e.dataTransfer.types.includes('application/x-tab-drag')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setIsDragOver(true)
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    try {
      const raw = e.dataTransfer.getData('application/x-tab-drag')
      if (!raw) return
      const { tabId, sourcePanelId } = JSON.parse(raw) as {
        tabId: string
        sourcePanelId: string
      }
      if (tabId && sourcePanelId && sourcePanelId !== panel.id) {
        dispatch(moveTab({ tabId, sourcePanelId, targetPanelId: panel.id }))
      }
    } catch {
      // ignore malformed drag data
    }
  }

  function handleAddTab() {
    const activeTab = panel.tabs.find((t) => t.id === panel.activeTabId)
    const type: PanelType = activeTab?.type ?? 'editor'
    const title = TAB_DEFAULT_TITLES[type] ?? 'Panel'
    dispatch(addTab({ panelId: panel.id, tab: { id: generateId('tab'), type, title } }))
  }

  return (
    <div
      className={`${styles.tabBar} ${isDragOver ? styles.tabBarDragOver : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={styles.tabBarTabs}>
        {panel.tabs.map((tab) => (
          <div
            key={tab.id}
            className={`${styles.tab} ${isActivePanel && panel.activeTabId === tab.id ? styles.activeTab : ''}`}
            draggable={editingTabId !== tab.id}
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragEnd={handleDragEnd}
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

      {/* Add-tab (+) button */}
      <div className={styles.addTabWrapper}>
        <button
          className={styles.addTabBtn}
          onClick={(e) => { e.stopPropagation(); handleAddTab() }}
          title="New tab"
          aria-label="New tab"
        >
          +
        </button>
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
      return <ProseMirrorEditor tabId={activeTab.id} />
    case 'diagram':
      return <DiagramCanvas tabId={activeTab.id} />
    case 'settings':
      return <Settings />
    case 'chat':
      return <ChatPane embedded tabId={activeTab.id} />
    case 'log':
      return <LogViewer />
    default:
      return (
        <div className={styles.emptyPanel}>
          <span>Empty Panel</span>
        </div>
      )
  }
}

const EDGES = ['left', 'right', 'top', 'bottom'] as const
type Edge = (typeof EDGES)[number]

function EdgeDropZones({ panel }: { panel: WorkspacePanel }) {
  const dispatch = useDispatch()
  const { isDraggingTab } = useContext(TabDragContext)
  const [hoveredEdge, setHoveredEdge] = useState<Edge | null>(null)

  if (!isDraggingTab) return null

  function handleDragOver(e: React.DragEvent, edge: Edge) {
    if (e.dataTransfer.types.includes('application/x-tab-drag')) {
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = 'move'
      setHoveredEdge(edge)
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setHoveredEdge(null)
    }
  }

  function handleDrop(e: React.DragEvent, edge: Edge) {
    e.preventDefault()
    e.stopPropagation()
    setHoveredEdge(null)
    try {
      const raw = e.dataTransfer.getData('application/x-tab-drag')
      if (!raw) return
      const { tabId, sourcePanelId } = JSON.parse(raw) as { tabId: string; sourcePanelId: string }
      if (tabId && sourcePanelId) {
        dispatch(
          moveTabToSplit({
            tabId,
            sourcePanelId,
            targetPanelId: panel.id,
            edge,
            newPanelId: generateId('panel'),
            newRowId: generateId('row'),
          }),
        )
      }
    } catch {
      // ignore malformed drag data
    }
  }

  return (
    <>
      {EDGES.map((edge) => (
        <div
          key={edge}
          className={`${styles.edgeDropZone} ${styles[`edgeDropZone${edge.charAt(0).toUpperCase()}${edge.slice(1)}` as keyof typeof styles]} ${hoveredEdge === edge ? styles.edgeDropZoneHover : ''}`}
          onDragOver={(e) => handleDragOver(e, edge)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, edge)}
        />
      ))}
    </>
  )
}

export default function WorkspaceLayout() {
  const rows = useSelector((state: RootState) => state.workspace.rows)
  const activePanelId = useSelector((state: RootState) => state.workspace.activePanelId)
  const sidebarOpen = useSelector((state: RootState) => state.workspace.sidebarOpen)
  const chatOpen = useSelector((state: RootState) => state.workspace.chatOpen)
  const dispatch = useDispatch()
  const isMobile = useIsMobile()

  const [isDraggingTab, setIsDraggingTab] = useState(false)
  const dragDataRef = useRef<{ tabId: string; sourcePanelId: string } | null>(null)

  const tabDragContextValue: TabDragState = {
    isDraggingTab,
    startDrag: (tabId, sourcePanelId) => {
      setIsDraggingTab(true)
      dragDataRef.current = { tabId, sourcePanelId }
    },
    endDrag: () => {
      setIsDraggingTab(false)
      dragDataRef.current = null
    },
    dragData: dragDataRef.current,
  }

  const totalPanels = rows.reduce((sum, row) => sum + row.panels.length, 0)

  return (
    <TabDragContext.Provider value={tabDragContextValue}>
      <>
        {/* Mobile: Sidebar drawer overlay */}
        {isMobile && sidebarOpen && (
          <>
            <div
              className={styles.mobileSidebarBackdrop}
              onClick={() => dispatch(toggleSidebar())}
            />
            <div className={styles.mobileSidebarDrawer}>
              <Sidebar />
            </div>
          </>
        )}

        {/* Mobile: Chat drawer overlay */}
        {isMobile && chatOpen && (
          <>
            <div
              className={styles.mobileChatBackdrop}
              onClick={() => dispatch(toggleChat())}
            />
            <div className={styles.mobileChatDrawer}>
              <ChatPane />
            </div>
          </>
        )}

        <PanelGroup direction="horizontal" className={styles.layout}>
          {!isMobile && sidebarOpen && (
            <>
              <Panel defaultSize={18} minSize={12} maxSize={40} className={styles.sidebarPanel}>
                <Sidebar />
              </Panel>
              <PanelResizeHandle className={styles.resizeHandle} />
            </>
          )}
          <Panel defaultSize={sidebarOpen && !isMobile ? 82 : 100} minSize={10} className={styles.contentArea}>
            <PanelGroup direction="vertical" className={styles.innerLayout}>
              {rows.map((row, rowIndex) => (
                <React.Fragment key={row.id}>
                  <Panel defaultSize={100 / rows.length} minSize={10} className={styles.rowPanel}>
                    <PanelGroup direction="horizontal" className={styles.innerLayout}>
                      {row.panels.map((panel, panelIndex) => (
                        <React.Fragment key={panel.id}>
                          <Panel
                            defaultSize={100 / row.panels.length}
                            minSize={10}
                            className={`${styles.panel} ${activePanelId === panel.id ? styles.activePanel : ''}`}
                            onClick={() => dispatch(setActivePanel(panel.id))}
                          >
                            <TabBar panel={panel} showClose={totalPanels > 1} />
                            <div className={styles.panelBody}>
                              <ActiveTabContent panel={panel} />
                              <EdgeDropZones panel={panel} />
                            </div>
                          </Panel>
                          {panelIndex < row.panels.length - 1 && (
                            <PanelResizeHandle
                              key={`handle-${panel.id}`}
                              className={styles.resizeHandle}
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </PanelGroup>
                  </Panel>
                  {rowIndex < rows.length - 1 && (
                    <PanelResizeHandle
                      key={`row-handle-${row.id}`}
                      className={styles.resizeHandleHorizontal}
                    />
                  )}
                </React.Fragment>
              ))}
            </PanelGroup>
          </Panel>
          {!isMobile && chatOpen && <ChatPane />}
        </PanelGroup>
      </>
    </TabDragContext.Provider>
  )
}
