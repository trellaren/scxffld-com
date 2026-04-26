import { useSelector } from 'react-redux'
import { RootState } from './store'
import WorkspaceLayout from './components/Layout/WorkspaceLayout'
import Header from './components/Header/Header'
import TimelineMenu from './components/Timeline/TimelineMenu'
import LoginPage from './components/Auth/LoginPage'
import styles from './App.module.css'

function App() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

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
    </div>
  )
}

export default App
