import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from './store'
import WorkspaceLayout from './components/Layout/WorkspaceLayout'
import Header from './components/Header/Header'
import TimelineMenu from './components/Timeline/TimelineMenu'
import StatusBar from './components/StatusBar/StatusBar'
import LoginPage from './components/Auth/LoginPage'
import styles from './App.module.css'

function App() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const activeTheme = useSelector((state: RootState) => state.settings.settings.theme.activeTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme)
  }, [activeTheme])

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <div className={styles.appShell}>
      <Header />
      <TimelineMenu />
      <main className={styles.workspace}>
        <WorkspaceLayout />
      </main>
      <StatusBar />
    </div>
  )
}

export default App
