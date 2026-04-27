import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { AuthProvider } from '../authUtils'

export interface User {
  id: string
  username: string
  email: string
  displayName: string
  provider: AuthProvider
}

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  authError: string | null
  user: User | null
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  authError: null,
  user: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action: PayloadAction<User>) {
      state.isAuthenticated = true
      state.isLoading = false
      state.authError = null
      state.user = action.payload
    },
    logout(state) {
      state.isAuthenticated = false
      state.isLoading = false
      state.authError = null
      state.user = null
    },
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    setAuthError(state, action: PayloadAction<string | null>) {
      state.authError = action.payload
      state.isLoading = false
    },
  },
})

export const { login, logout, setAuthLoading, setAuthError } = authSlice.actions
export default authSlice.reducer
