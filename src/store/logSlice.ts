import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type LogLevel = 'log' | 'info' | 'warn' | 'error'

export interface LogEntry {
  id: string
  level: LogLevel
  message: string
  timestamp: string
}

interface LogState {
  entries: LogEntry[]
}

const MAX_ENTRIES = 1000
let _entryCounter = 0

const logSlice = createSlice({
  name: 'log',
  initialState: { entries: [] } as LogState,
  reducers: {
    addLogEntry(state, action: PayloadAction<Omit<LogEntry, 'id'>>) {
      state.entries.push({
        id: `log-${++_entryCounter}`,
        ...action.payload,
      })
      if (state.entries.length > MAX_ENTRIES) {
        state.entries.splice(0, state.entries.length - MAX_ENTRIES)
      }
    },
    clearLog(state) {
      state.entries = []
    },
  },
})

export const { addLogEntry, clearLog } = logSlice.actions
export default logSlice.reducer
