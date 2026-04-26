import { useState, FormEvent } from 'react'
import { useDispatch } from 'react-redux'
import { login } from '../../store/authSlice'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const dispatch = useDispatch()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!username.trim()) {
      setError('Username is required.')
      return
    }
    if (!password) {
      setError('Password is required.')
      return
    }
    // Client-side only auth — any non-empty credentials are accepted
    setError('')
    dispatch(login({ username: username.trim(), displayName: username.trim() }))
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>scxffld</div>
        <p className={styles.subtitle}>Sign in to your workspace</p>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {error && <p className={styles.error}>{error}</p>}
          <label className={styles.label} htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className={styles.input}
            type="text"
            autoComplete="username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className={styles.input}
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className={styles.button}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
