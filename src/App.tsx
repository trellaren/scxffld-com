import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './store'
import { login, setAuthLoading, setAuthError } from './store/authSlice'
import {
  getOAuthCallbackParams,
  getOAuthConfig,
  exchangeOAuthCode,
} from './authUtils'
import WorkspaceLayout from './components/Layout/WorkspaceLayout'
import Header from './components/Header/Header'
import TimelineMenu from './components/Timeline/TimelineMenu'
import StatusBar from './components/StatusBar/StatusBar'
import LoginPage from './components/Auth/LoginPage'
import { logger } from './logger'
import styles from './App.module.css'

function App() {
  const dispatch = useDispatch()
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const isAuthLoading = useSelector((state: RootState) => state.auth.isLoading)
  const activeTheme = useSelector((state: RootState) => state.settings.settings.theme.activeTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme)
  }, [activeTheme])

  // Handle OAuth provider redirect callback (code + state in URL)
  useEffect(() => {
    const params = getOAuthCallbackParams()
    if (!params) return

    // Remove OAuth query params from the URL without triggering a navigation
    window.history.replaceState({}, document.title, window.location.pathname)

    const config = getOAuthConfig(params.provider)
    if (!config) {
      dispatch(setAuthError('OAuth provider is not configured.'))
      return
    }

    dispatch(setAuthLoading(true))
    exchangeOAuthCode(params.provider, params.code, params.verifier, config)
      .then((userInfo) => {
        logger.info(`OAuth sign-in: ${userInfo.username} (${params.provider})`)
        dispatch(
          login({
            id: userInfo.id,
            username: userInfo.username,
            email: userInfo.email,
            displayName: userInfo.displayName,
            provider: params.provider,
          }),
        )
      })
      .catch((err: Error) => {
        logger.error(`OAuth token exchange failed: ${err.message}`)
        dispatch(setAuthError(err.message))
      })
  }, [dispatch])

  if (isAuthLoading) {
    return (
      <div className={styles.authLoading}>
        <div className={styles.authLoadingSpinner} />
        <span>Signing you in…</span>
      </div>
    )
  }

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
