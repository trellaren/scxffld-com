import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import styles from './PdfViewer.module.css'

interface PdfViewerProps {
  tabId: string
}

export default function PdfViewer({ tabId }: PdfViewerProps) {
  const dataUrl = useSelector((state: RootState) => state.workspace.fileContents[tabId])

  if (!dataUrl) {
    return (
      <div className={styles.placeholder}>
        <span>No PDF loaded.</span>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <iframe
        className={styles.frame}
        src={dataUrl}
        title="PDF Viewer"
      />
    </div>
  )
}
