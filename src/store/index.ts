import { configureStore } from '@reduxjs/toolkit'
import workspaceReducer from './workspaceSlice'
import authReducer from './authSlice'
import fileTreeReducer from './fileTreeSlice'

export const store = configureStore({
  reducer: {
    workspace: workspaceReducer,
    auth: authReducer,
    fileTree: fileTreeReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
