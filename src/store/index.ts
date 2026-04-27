import { configureStore } from '@reduxjs/toolkit'
import workspaceReducer from './workspaceSlice'
import authReducer from './authSlice'
import timelineReducer from './timelineSlice'
import aiReducer from './aiSlice'
import settingsReducer from './settingsSlice'
import logReducer from './logSlice'

export const store = configureStore({
  reducer: {
    workspace: workspaceReducer,
    auth: authReducer,
    timeline: timelineReducer,
    ai: aiReducer,
    settings: settingsReducer,
    log: logReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
