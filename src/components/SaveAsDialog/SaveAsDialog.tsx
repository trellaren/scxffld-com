import { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import type { Tab } from '../../store/workspaceSlice'
import {
  exportTextAsTxt,
  exportTextAsJson,
  exportTextAsDocx,
  exportTextAsDoc,
  exportTextAsPdf,
  exportDiagramAsJson,
  exportDiagramAsSvg,
  exportDiagramAsPng,
  exportDiagramAsJpeg,
  exportDiagramAsPdf,
} from '../../utils/exportUtils'
import styles from './SaveAsDialog.module.css'

type TextFormat = 'txt' | 'json' | 'docx' | 'doc' | 'pdf'
type DiagramFormat = 'json' | 'svg' | 'png' | 'jpeg' | 'pdf'

const TEXT_FORMATS: { value: TextFormat; label: string }[] = [
  { value: 'txt', label: 'Plain Text (.txt)' },
  { value: 'json', label: 'JSON (.json)' },
  { value: 'docx', label: 'Word Document (.docx)' },
  { value: 'doc', label: 'Word 97-2003 (.doc)' },
  { value: 'pdf', label: 'PDF (.pdf)' },
]

const DIAGRAM_FORMATS: { value: DiagramFormat; label: string }[] = [
  { value: 'json', label: 'JSON (.json)' },
  { value: 'svg', label: 'SVG Image (.svg)' },
  { value: 'png', label: 'PNG Image (.png)' },
  { value: 'jpeg', label: 'JPEG Image (.jpeg)' },
  { value: 'pdf', label: 'PDF (.pdf)' },
]

interface SaveAsDialogProps {
  activeTab: Tab | null
  onClose: () => void
}

export default function SaveAsDialog({ activeTab, onClose }: SaveAsDialogProps) {
  const diagramData = useSelector((state: RootState) => state.workspace.diagramData)

  const isDiagram = activeTab?.type === 'diagram'
  const baseTitle = activeTab?.title ?? 'file'
  // Strip any existing extension for the default filename stem
  const stem = baseTitle.replace(/\.[^/.]+$/, '')

  const [filename, setFilename] = useState(stem)
  const [textFormat, setTextFormat] = useState<TextFormat>('txt')
  const [diagramFormat, setDiagramFormat] = useState<DiagramFormat>('json')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!activeTab) return
    setSaving(true)
    try {
      if (isDiagram) {
        const data = diagramData[activeTab.id]
        const nodes = data?.nodes ?? []
        const edges = data?.edges ?? []
        const name = `${filename}.${diagramFormat}`
        switch (diagramFormat) {
          case 'json':
            exportDiagramAsJson(nodes, edges, name)
            break
          case 'svg':
            exportDiagramAsSvg(nodes, edges, name)
            break
          case 'png':
            await exportDiagramAsPng(nodes, edges, name)
            break
          case 'jpeg':
            await exportDiagramAsJpeg(nodes, edges, name)
            break
          case 'pdf':
            await exportDiagramAsPdf(nodes, edges, name)
            break
        }
      } else {
        const name = `${filename}.${textFormat}`
        switch (textFormat) {
          case 'txt':
            await exportTextAsTxt(activeTab.id, name)
            break
          case 'json':
            await exportTextAsJson(activeTab.id, name)
            break
          case 'docx':
            await exportTextAsDocx(activeTab.id, name)
            break
          case 'doc':
            await exportTextAsDoc(activeTab.id, name)
            break
          case 'pdf':
            await exportTextAsPdf(activeTab.id, name)
            break
        }
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.title}>Save As</div>

        <label className={styles.label}>
          Filename
          <input
            className={styles.input}
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            autoFocus
          />
        </label>

        <div className={styles.label}>Format</div>
        <ul className={styles.formatList}>
          {(isDiagram ? DIAGRAM_FORMATS : TEXT_FORMATS).map((fmt) => {
            const selected = isDiagram
              ? diagramFormat === fmt.value
              : textFormat === fmt.value
            return (
              <li
                key={fmt.value}
                className={`${styles.formatItem} ${selected ? styles.formatItemSelected : ''}`}
                onClick={() =>
                  isDiagram
                    ? setDiagramFormat(fmt.value as DiagramFormat)
                    : setTextFormat(fmt.value as TextFormat)
                }
              >
                {fmt.label}
              </li>
            )
          })}
        </ul>

        <div className={styles.actions}>
          <button className={styles.buttonSecondary} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className={styles.buttonPrimary}
            onClick={handleSave}
            disabled={saving || !filename.trim()}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
