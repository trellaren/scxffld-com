import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import DOMPurify from 'dompurify'
import { RootState } from '../../store'
import styles from './DocViewer.module.css'

interface DocViewerProps {
  tabId: string
}

export default function DocViewer({ tabId }: DocViewerProps) {
  const dataUrl = useSelector((state: RootState) => state.workspace.fileContents[tabId])
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!dataUrl) return

    setLoading(true)
    setError(null)
    setHtml(null)

    // dataUrl is a base64 data URL – convert to ArrayBuffer then use mammoth
    const base64 = dataUrl.split(',')[1]
    if (!base64) {
      setError('Could not read file content.')
      setLoading(false)
      return
    }

    const binaryStr = atob(base64)
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }
    const buffer = bytes.buffer

    import('mammoth').then(({ convertToHtml }) => {
      return convertToHtml({ arrayBuffer: buffer })
    }).then((result) => {
      setHtml(DOMPurify.sanitize(result.value))
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to render document: ${message}`)
    }).finally(() => {
      setLoading(false)
    })
  }, [dataUrl])

  if (!dataUrl) {
    return (
      <div className={styles.placeholder}>
        <span>No document loaded.</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.placeholder}>
        <span>Loading document…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.placeholder}>
        <span className={styles.error}>{error}</span>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: html ?? '' }}
      />
    </div>
  )
}
