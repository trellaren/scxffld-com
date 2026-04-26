import React from 'react'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { setActivePanel } from '../../store/workspaceSlice'
import ProseMirrorEditor from '../Editor/ProseMirrorEditor'
import DiagramCanvas from '../Diagram/DiagramCanvas'
import Sidebar from '../Sidebar/Sidebar'
import styles from './WorkspaceLayout.module.css'

function PanelContent({ panelId }: { panelId: string }) {
  const panel = useSelector((state: RootState) =>
    state.workspace.panels.find((p) => p.id === panelId),
  )

  if (!panel) return null

  switch (panel.type) {
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
      {panels.map((panel, index) => (
        <React.Fragment key={panel.id}>
          <Panel
            defaultSize={sidebarOpen ? (82 / panels.length) : (100 / panels.length)}
            minSize={10}
            className={`${styles.panel} ${activePanelId === panel.id ? styles.activePanel : ''}`}
            onClick={() => dispatch(setActivePanel(panel.id))}
          >
            <div className={styles.panelHeader}>
              <span>{panel.title}</span>
            </div>
            <div className={styles.panelBody}>
              <PanelContent panelId={panel.id} />
            </div>
          </Panel>
          {index < panels.length - 1 && (
            <PanelResizeHandle key={`handle-${panel.id}`} className={styles.resizeHandle} />
          )}
        </React.Fragment>
      ))}
    </PanelGroup>
  )
}
