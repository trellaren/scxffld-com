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
  }
}
