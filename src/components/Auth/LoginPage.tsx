import { useState, useRef, FormEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../../store'
import { login, setAuthLoading, setAuthError } from '../../store/authSlice'
import {
  hashPassword,
  verifyPassword,
  findUserByEmail,
  findUserByUsername,
  saveStoredUser,
  getOAuthConfig,
  buildOAuthUrl,
  generateUserId,
} from '../../authUtils'
import type { OAuthProvider } from '../../authUtils'
import { logger } from '../../logger'
import styles from './LoginPage.module.css'

// ── Provider SVG icons ────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path fill="#f25022" d="M1 1h10v10H1z" />
      <path fill="#00a4ef" d="M13 1h10v10H13z" />
      <path fill="#7fba00" d="M1 13h10v10H1z" />
      <path fill="#ffb900" d="M13 13h10v10H13z" />
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

type Tab = 'signin' | 'register'

// ── Rate-limit constants ──────────────────────────────────────────────────────
const MAX_SIGN_IN_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 60_000 // 60 seconds

export default function LoginPage() {
  const dispatch = useDispatch()
  const authError = useSelector((state: RootState) => state.auth.authError)

  const [tab, setTab] = useState<Tab>('signin')

  // Sign In form state
  const [siIdentifier, setSiIdentifier] = useState('')
  const [siPassword, setSiPassword] = useState('')
  const [siError, setSiError] = useState('')
  const [siLoading, setSiLoading] = useState(false)

  // Brute-force rate-limiting state (stored in refs so they survive re-renders
  // without triggering an extra render cycle)
  const failedAttemptsRef = useRef(0)
  const lockoutUntilRef = useRef<number>(0)

  // Register form state
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regDisplayName, setRegDisplayName] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  const googleConfig = getOAuthConfig('google')
  const githubConfig = getOAuthConfig('github')
  const microsoftConfig = getOAuthConfig('microsoft')
  const hasOAuth = !!(googleConfig || githubConfig || microsoftConfig)

  function switchTab(next: Tab) {
    setTab(next)
    setSiError('')
    setRegError('')
    dispatch(setAuthError(null))
  }

  // ── Sign In handler ─────────────────────────────────────────────────────────

  /** Record a failed attempt and return the error message to display. */
  function recordFailedAttempt(): string {
    failedAttemptsRef.current += 1
    if (failedAttemptsRef.current >= MAX_SIGN_IN_ATTEMPTS) {
      lockoutUntilRef.current = Date.now() + LOCKOUT_DURATION_MS
      failedAttemptsRef.current = 0
      return 'Too many failed attempts. Please wait 60 seconds before trying again.'
    }
    return 'Invalid username/email or password.'
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault()
    setSiError('')

    // Rate-limit: check if still locked out
    const now = Date.now()
    if (now < lockoutUntilRef.current) {
      const secsLeft = Math.ceil((lockoutUntilRef.current - now) / 1000)
      setSiError(`Too many failed attempts. Please wait ${secsLeft} second${secsLeft === 1 ? '' : 's'} before trying again.`)
      return
    }

    const identifier = siIdentifier.trim()
    if (!identifier) {
      setSiError('Username or email is required.')
      return
    }
    if (!siPassword) {
      setSiError('Password is required.')
      return
    }
    setSiLoading(true)
    try {
      const stored = findUserByEmail(identifier) ?? findUserByUsername(identifier)
      if (!stored) {
        setSiError(recordFailedAttempt())
        setSiLoading(false)
        return
      }
      const valid = await verifyPassword(siPassword, stored.passwordHash, stored.passwordSalt)
      if (!valid) {
        setSiError(recordFailedAttempt())
        setSiLoading(false)
        return
      }
      // Successful sign-in — reset failure counter
      failedAttemptsRef.current = 0
      lockoutUntilRef.current = 0
      logger.info(`User signed in: ${stored.username}`)
      dispatch(
        login({
          id: stored.id,
          username: stored.username,
          email: stored.email,
          displayName: stored.displayName,
          provider: 'local',
        }),
      )
    } catch {
      setSiError('An unexpected error occurred. Please try again.')
    }
    setSiLoading(false)
  }

  // ── Register handler ────────────────────────────────────────────────────────

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    setRegError('')
    const username = regUsername.trim()
    const email = regEmail.trim().toLowerCase()
    const displayName = regDisplayName.trim() || username

    if (!username) {
      setRegError('Username is required.')
      return
    }
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
      setRegError(
        'Username must be 3–30 characters and may only contain letters, numbers, underscores, and hyphens.',
      )
      return
    }
    if (!email) {
      setRegError('Email is required.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setRegError('Please enter a valid email address.')
      return
    }
    if (!regPassword) {
      setRegError('Password is required.')
      return
    }
    if (regPassword.length < 8) {
      setRegError('Password must be at least 8 characters.')
      return
    }
    if (regPassword !== regConfirm) {
      setRegError('Passwords do not match.')
      return
    }

    setRegLoading(true)
    try {
      if (findUserByUsername(username)) {
        setRegError('Username is already taken.')
        setRegLoading(false)
        return
      }
      if (findUserByEmail(email)) {
        setRegError('An account with this email already exists.')
        setRegLoading(false)
        return
      }

      const { hash, salt } = await hashPassword(regPassword)
      const newUser = {
        id: generateUserId(),
        username,
        email,
        displayName,
        passwordHash: hash,
        passwordSalt: salt,
        createdAt: new Date().toISOString(),
      }
      saveStoredUser(newUser)
      logger.info(`New user registered: ${username}`)
      dispatch(
        login({
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          displayName: newUser.displayName,
          provider: 'local',
        }),
      )
    } catch {
      setRegError('An unexpected error occurred. Please try again.')
    }
    setRegLoading(false)
  }

  // ── OAuth handler ───────────────────────────────────────────────────────────

  async function handleOAuth(provider: OAuthProvider) {
    const config = getOAuthConfig(provider)
    if (!config) return
    try {
      dispatch(setAuthLoading(true))
      const url = await buildOAuthUrl(provider, config)
      window.location.href = url
    } catch {
      dispatch(setAuthError('Failed to initiate sign-in. Please try again.'))
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const oauthError = authError

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>scxffld</div>
        <p className={styles.subtitle}>Sign in to your workspace</p>

        {/* OAuth provider buttons */}
        {hasOAuth && (
          <div className={styles.oauthSection}>
            {oauthError && <p className={styles.error}>{oauthError}</p>}
            {googleConfig && (
              <button
                type="button"
                className={`${styles.oauthButton} ${styles.oauthGoogle}`}
                onClick={() => handleOAuth('google')}
              >
                <GoogleIcon />
                Continue with Google
              </button>
            )}
            {githubConfig && (
              <button
                type="button"
                className={`${styles.oauthButton} ${styles.oauthGithub}`}
                onClick={() => handleOAuth('github')}
              >
                <GithubIcon />
                Continue with GitHub
              </button>
            )}
            {microsoftConfig && (
              <button
                type="button"
                className={`${styles.oauthButton} ${styles.oauthMicrosoft}`}
                onClick={() => handleOAuth('microsoft')}
              >
                <MicrosoftIcon />
                Continue with Microsoft
              </button>
            )}
            <div className={styles.divider}>
              <span>or</span>
            </div>
          </div>
        )}

        {/* Local auth tabs */}
        <div className={styles.tabs}>
          <button
            type="button"
            className={tab === 'signin' ? styles.tabActive : styles.tab}
            onClick={() => switchTab('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={tab === 'register' ? styles.tabActive : styles.tab}
            onClick={() => switchTab('register')}
          >
            Register
          </button>
        </div>

        {/* Sign In form */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className={styles.form} noValidate>
            {siError && <p className={styles.error}>{siError}</p>}
            <label className={styles.label} htmlFor="si-identifier">
              Username or Email
            </label>
            <input
              id="si-identifier"
              className={styles.input}
              type="text"
              autoComplete="username"
              placeholder="Enter your username or email"
              value={siIdentifier}
              onChange={(e) => setSiIdentifier(e.target.value)}
            />
            <label className={styles.label} htmlFor="si-password">
              Password
            </label>
            <input
              id="si-password"
              className={styles.input}
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={siPassword}
              onChange={(e) => setSiPassword(e.target.value)}
            />
            <button type="submit" className={styles.button} disabled={siLoading}>
              {siLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Register form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className={styles.form} noValidate>
            {regError && <p className={styles.error}>{regError}</p>}
            <label className={styles.label} htmlFor="reg-username">
              Username
            </label>
            <input
              id="reg-username"
              className={styles.input}
              type="text"
              autoComplete="username"
              placeholder="Choose a username (3–30 chars)"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
            />
            <label className={styles.label} htmlFor="reg-email">
              Email
            </label>
            <input
              id="reg-email"
              className={styles.input}
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
            />
            <label className={styles.label} htmlFor="reg-displayname">
              Display Name{' '}
              <span className={styles.optional}>(optional)</span>
            </label>
            <input
              id="reg-displayname"
              className={styles.input}
              type="text"
              autoComplete="name"
              placeholder="How you'll appear to others"
              value={regDisplayName}
              onChange={(e) => setRegDisplayName(e.target.value)}
            />
            <label className={styles.label} htmlFor="reg-password">
              Password
            </label>
            <input
              id="reg-password"
              className={styles.input}
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
            />
            <label className={styles.label} htmlFor="reg-confirm">
              Confirm Password
            </label>
            <input
              id="reg-confirm"
              className={styles.input}
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={regConfirm}
              onChange={(e) => setRegConfirm(e.target.value)}
            />
            <button type="submit" className={styles.button} disabled={regLoading}>
              {regLoading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
