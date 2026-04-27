// Authentication utilities: PBKDF2 password hashing, local user store, OAuth PKCE helpers.

export type AuthProvider = 'local' | 'google' | 'github' | 'microsoft'
export type OAuthProvider = 'google' | 'github' | 'microsoft'

// ── Local user store ──────────────────────────────────────────────────────────

export interface StoredUser {
  id: string
  username: string
  email: string
  displayName: string
  passwordHash: string
  passwordSalt: string
  createdAt: string
}

const USERS_KEY = 'scxffld:users'
const OAUTH_STATE_KEY = 'scxffld:oauth_state'
const OAUTH_VERIFIER_KEY = 'scxffld:oauth_verifier'
const OAUTH_PROVIDER_KEY = 'scxffld:oauth_provider'

function hexEncode(data: Uint8Array<ArrayBuffer>): string {
  return Array.from(data)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexDecode(hex: string): Uint8Array<ArrayBuffer> {
  const result = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    result[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return result
}

export async function hashPassword(
  password: string,
  saltHex?: string,
): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder()
  const salt = saltHex ? hexDecode(saltHex) : crypto.getRandomValues(new Uint8Array(16))
  // Cast to ArrayBuffer to satisfy Web Crypto API types under TypeScript 5.6+
  const passwordBuffer = enc.encode(password).buffer as ArrayBuffer
  const keyMaterial = await crypto.subtle.importKey('raw', passwordBuffer, 'PBKDF2', false, [
    'deriveBits',
  ])
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  return { hash: hexEncode(new Uint8Array(hashBuffer)), salt: hexEncode(salt) }
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string,
): Promise<boolean> {
  const { hash } = await hashPassword(password, storedSalt)
  return hash === storedHash
}

export function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as StoredUser[]) : []
  } catch {
    return []
  }
}

function saveUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function findUserByEmail(email: string): StoredUser | null {
  return (
    getStoredUsers().find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null
  )
}

export function findUserByUsername(username: string): StoredUser | null {
  return (
    getStoredUsers().find((u) => u.username.toLowerCase() === username.toLowerCase()) ?? null
  )
}

export function saveStoredUser(user: StoredUser): void {
  const users = getStoredUsers()
  const idx = users.findIndex((u) => u.id === user.id)
  if (idx >= 0) {
    users[idx] = user
  } else {
    users.push(user)
  }
  saveUsers(users)
}

export function generateUserId(): string {
  const buf = new Uint8Array(12)
  crypto.getRandomValues(buf)
  return hexEncode(buf)
}

// ── OAuth PKCE helpers ────────────────────────────────────────────────────────

function base64URLEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export function generateCodeVerifier(): string {
  const buf = new Uint8Array(32)
  crypto.getRandomValues(buf)
  return base64URLEncode(buf.buffer as ArrayBuffer)
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer)
  return base64URLEncode(digest)
}

export function generateState(): string {
  const buf = new Uint8Array(16)
  crypto.getRandomValues(buf)
  return base64URLEncode(buf.buffer as ArrayBuffer)
}

// ── OAuth provider configuration ──────────────────────────────────────────────

export interface OAuthConfig {
  clientId: string
  redirectUri: string
  tenantId?: string
}

export function getOAuthConfig(provider: OAuthProvider): OAuthConfig | null {
  const redirectUri = `${window.location.origin}${window.location.pathname}`
  switch (provider) {
    case 'google': {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
      return clientId ? { clientId, redirectUri } : null
    }
    case 'github': {
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID as string | undefined
      return clientId ? { clientId, redirectUri } : null
    }
    case 'microsoft': {
      const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID as string | undefined
      if (!clientId) return null
      const tenantId =
        (import.meta.env.VITE_MICROSOFT_TENANT_ID as string | undefined) ?? 'common'
      return { clientId, redirectUri, tenantId }
    }
  }
}

export async function buildOAuthUrl(
  provider: OAuthProvider,
  config: OAuthConfig,
): Promise<string> {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = generateState()

  sessionStorage.setItem(OAUTH_STATE_KEY, state)
  sessionStorage.setItem(OAUTH_VERIFIER_KEY, verifier)
  sessionStorage.setItem(OAUTH_PROVIDER_KEY, provider)

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
  })

  switch (provider) {
    case 'google':
      params.set('response_type', 'code')
      params.set('scope', 'openid email profile')
      params.set('code_challenge', challenge)
      params.set('code_challenge_method', 'S256')
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

    case 'github':
      // GitHub requires client_secret for token exchange; token exchange happens
      // server-side via a configurable proxy (VITE_OAUTH_PROXY_URL) or is skipped.
      params.set('scope', 'read:user user:email')
      return `https://github.com/login/oauth/authorize?${params.toString()}`

    case 'microsoft':
      params.set('response_type', 'code')
      params.set('scope', 'openid email profile')
      params.set('code_challenge', challenge)
      params.set('code_challenge_method', 'S256')
      return `https://login.microsoftonline.com/${config.tenantId ?? 'common'}/oauth2/v2.0/authorize?${params.toString()}`
  }
}

// ── OAuth callback handling ────────────────────────────────────────────────────

export interface OAuthCallbackResult {
  code: string
  state: string
  provider: OAuthProvider
  verifier: string
}

export function getOAuthCallbackParams(): OAuthCallbackResult | null {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')
  if (!code || !state) return null

  const storedState = sessionStorage.getItem(OAUTH_STATE_KEY)
  const storedVerifier = sessionStorage.getItem(OAUTH_VERIFIER_KEY)
  const storedProvider = sessionStorage.getItem(OAUTH_PROVIDER_KEY) as OAuthProvider | null

  if (!storedState || !storedVerifier || !storedProvider) return null
  if (state !== storedState) return null

  sessionStorage.removeItem(OAUTH_STATE_KEY)
  sessionStorage.removeItem(OAUTH_VERIFIER_KEY)
  sessionStorage.removeItem(OAUTH_PROVIDER_KEY)

  return { code, state, provider: storedProvider, verifier: storedVerifier }
}

export interface OAuthUserInfo {
  id: string
  username: string
  email: string
  displayName: string
}

export async function exchangeOAuthCode(
  provider: OAuthProvider,
  code: string,
  verifier: string,
  config: OAuthConfig,
): Promise<OAuthUserInfo> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    code,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
    code_verifier: verifier,
  })

  let tokenUrl: string
  let userInfoUrl: string

  switch (provider) {
    case 'google':
      tokenUrl = 'https://oauth2.googleapis.com/token'
      userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo'
      break
    case 'github': {
      const proxyUrl = import.meta.env.VITE_OAUTH_PROXY_URL as string | undefined
      if (!proxyUrl) {
        throw new Error(
          'GitHub OAuth requires a server-side token exchange. Set VITE_OAUTH_PROXY_URL to a backend proxy URL.',
        )
      }
      tokenUrl = `${proxyUrl}/github/token`
      userInfoUrl = 'https://api.github.com/user'
      break
    }
    case 'microsoft':
      tokenUrl = `https://login.microsoftonline.com/${config.tenantId ?? 'common'}/oauth2/v2.0/token`
      userInfoUrl = 'https://graph.microsoft.com/v1.0/me'
      break
  }

  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: body.toString(),
  })

  if (!tokenRes.ok) {
    const errText = await tokenRes.text()
    throw new Error(`Token exchange failed: ${errText}`)
  }

  const tokenData = (await tokenRes.json()) as { access_token: string }

  const userRes = await fetch(userInfoUrl, {
    headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/json' },
  })

  if (!userRes.ok) throw new Error('Failed to fetch user info from provider.')

  if (provider === 'google') {
    const info = (await userRes.json()) as { id: string; email: string; name: string }
    return {
      id: `google:${info.id}`,
      username: info.email.split('@')[0],
      email: info.email,
      displayName: info.name || info.email,
    }
  } else if (provider === 'github') {
    const info = (await userRes.json()) as {
      id: number
      login: string
      name: string | null
      email: string | null
    }
    return {
      id: `github:${info.id}`,
      username: info.login,
      email: info.email ?? `${info.login}@github`,
      displayName: info.name ?? info.login,
    }
  } else {
    // Microsoft
    const info = (await userRes.json()) as {
      id: string
      mail: string | null
      userPrincipalName: string
      displayName: string
    }
    const email = info.mail ?? info.userPrincipalName
    return {
      id: `microsoft:${info.id}`,
      username: email.split('@')[0],
      email,
      displayName: info.displayName || email,
    }
  }
}
