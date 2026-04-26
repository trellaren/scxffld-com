import { configureStore } from '@reduxjs/toolkit'
import workspaceReducer from './workspaceSlice'
import authReducer from './authSlice'
import timelineReducer from './timelineSlice'

export const store = configureStore({
  reducer: {
    workspace: workspaceReducer,
    auth: authReducer,
    timeline: timelineReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
