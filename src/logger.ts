import { store } from './store'
import { addLogEntry } from './store/logSlice'
import type { LogLevel } from './store/logSlice'

function formatArgs(args: unknown[]): string {
  return args
    .map((a) => {
      if (typeof a === 'string') return a
      if (a instanceof Error) return `${a.name}: ${a.message}`
      try {
        return JSON.stringify(a)
      } catch {
        return String(a)
      }
    })
    .join(' ')
}

let isCapturing = false

function capture(level: LogLevel, args: unknown[]): void {
  if (isCapturing) return
  isCapturing = true
  try {
    const message = formatArgs(args)
    const timestamp = new Date().toISOString()
    store.dispatch(addLogEntry({ level, message, timestamp }))
    if (window.electronAPI?.writeLog) {
      window.electronAPI.writeLog(level, message, timestamp)
    }
  } finally {
    isCapturing = false
  }
}

let initialized = false

export function initLogger(): void {
  if (initialized) return
  initialized = true

  const origLog = console.log.bind(console)
  const origInfo = console.info.bind(console)
  const origWarn = console.warn.bind(console)
  const origError = console.error.bind(console)

  console.log = ((...args: unknown[]) => {
    origLog(...args)
    capture('log', args)
  }) as typeof console.log

  console.info = ((...args: unknown[]) => {
    origInfo(...args)
    capture('info', args)
  }) as typeof console.info

  console.warn = ((...args: unknown[]) => {
    origWarn(...args)
    capture('warn', args)
  }) as typeof console.warn

  console.error = ((...args: unknown[]) => {
    origError(...args)
    capture('error', args)
  }) as typeof console.error

  // Record the session start
  console.info('Session started')
}

export const logger = {
  log: (...args: unknown[]): void => console.log(...args),
  info: (...args: unknown[]): void => console.info(...args),
  warn: (...args: unknown[]): void => console.warn(...args),
  error: (...args: unknown[]): void => console.error(...args),
}
