import { useSelector } from 'react-redux'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { RootState } from './store'
import WorkspaceLayout from './components/Layout/WorkspaceLayout'
import Header from './components/Header/Header'
import ActivityBar from './components/Sidebar/ActivityBar'
import SidePanel from './components/Sidebar/SidePanel'
import LoginPage from './components/Auth/LoginPage'
import styles from './App.module.css'

function App() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const sidebarOpen = useSelector((state: RootState) => state.workspace.sidebarOpen)

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <div className={styles.appShell}>
      <Header />
      <div className={styles.body}>
        <ActivityBar />
        <PanelGroup direction="horizontal" className={styles.mainArea}>
          {sidebarOpen && (
            <>
              <Panel defaultSize={20} minSize={12} maxSize={40} className={styles.sidePanelWrapper}>
                <SidePanel />
              </Panel>
              <PanelResizeHandle className={styles.resizeHandle} />
            </>
          )}
          <Panel minSize={30}>
            <main className={styles.workspace}>
              <WorkspaceLayout />
            </main>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}

export default App
