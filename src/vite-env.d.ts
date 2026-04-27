/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}

interface Window {
  electronAPI?: {
    minimizeWindow: () => void
    maximizeWindow: () => void
    closeWindow: () => void
    writeLog: (level: string, message: string, timestamp: string) => void
    getLogPath: () => Promise<string>
    readLog: () => Promise<string>
  }
}
