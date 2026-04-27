import { useRef, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { clearLog } from '../../store/logSlice'
import styles from './LogViewer.module.css'

const LEVEL_LABELS: Record<string, string> = {
  log: 'LOG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERR',
}

function levelClass(level: string): string {
  switch (level) {
    case 'info':
      return styles.entryInfo
    case 'warn':
      return styles.entryWarn
    case 'error':
      return styles.entryError
    default:
      return styles.entryLog
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function LogViewer() {
  const dispatch = useDispatch()
  const entries = useSelector((state: RootState) => state.log.entries)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [logPath, setLogPath] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [showFile, setShowFile] = useState(false)

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  // Fetch log file path if running inside Electron
  useEffect(() => {
    if (window.electronAPI?.getLogPath) {
      window.electronAPI.getLogPath().then(setLogPath).catch(() => {
        /* non-critical */
      })
    }
  }, [])

  async function handleViewFile() {
    if (!window.electronAPI?.readLog) return
    try {
      const content = await window.electronAPI.readLog()
      setFileContent(content)
      setShowFile(true)
    } catch {
      /* non-critical */
    }
  }

  function handleHideFile() {
    setShowFile(false)
    setFileContent(null)
  }

  function handleClear() {
    dispatch(clearLog())
  }

  if (showFile && fileContent !== null) {
    return (
      <div className={styles.container}>
        <div className={styles.toolbar}>
          <span className={styles.toolbarTitle}>Log File: {logPath}</span>
          <div className={styles.toolbarActions}>
            <button className={styles.toolbarButton} onClick={handleHideFile}>
              ← In-App Log
            </button>
          </div>
        </div>
        <div className={styles.fileContent}>
          <pre>{fileContent}</pre>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>
          App Log ({entries.length} entr{entries.length === 1 ? 'y' : 'ies'})
          {logPath && <span className={styles.logPath}> · {logPath}</span>}
        </span>
        <div className={styles.toolbarActions}>
          {logPath && (
            <button className={styles.toolbarButton} onClick={handleViewFile}>
              View Log File
            </button>
          )}
          <button className={styles.toolbarButton} onClick={handleClear} disabled={entries.length === 0}>
            Clear
          </button>
        </div>
      </div>
      <div className={styles.logList}>
        {entries.length === 0 && (
          <div className={styles.empty}>No log entries yet.</div>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className={`${styles.entry} ${levelClass(entry.level)}`}>
            <span className={styles.timestamp}>{formatTime(entry.timestamp)}</span>
            <span className={styles.level}>{LEVEL_LABELS[entry.level] ?? entry.level.toUpperCase()}</span>
            <span className={styles.message}>{entry.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
