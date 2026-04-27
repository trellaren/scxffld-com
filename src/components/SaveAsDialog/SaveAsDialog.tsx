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
  exportChatAsTxt,
  exportChatAsJson,
  exportChatAsDocx,
  exportChatAsPdf,
} from '../../utils/exportUtils'
import styles from './SaveAsDialog.module.css'

type TextFormat = 'txt' | 'json' | 'docx' | 'doc' | 'pdf'
type DiagramFormat = 'json' | 'svg' | 'png' | 'jpeg' | 'pdf'
type ChatFormat = 'txt' | 'json' | 'docx' | 'pdf'

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

const CHAT_FORMATS: { value: ChatFormat; label: string }[] = [
  { value: 'txt', label: 'Plain Text (.txt)' },
  { value: 'json', label: 'JSON (.json)' },
  { value: 'docx', label: 'Word Document (.docx)' },
  { value: 'pdf', label: 'PDF (.pdf)' },
]

interface SaveAsDialogProps {
  activeTab: Tab | null
  onClose: () => void
}

export default function SaveAsDialog({ activeTab, onClose }: SaveAsDialogProps) {
  const diagramData = useSelector((state: RootState) => state.workspace.diagramData)
  const chatMessages = useSelector((state: RootState) => state.workspace.chatMessages)

  const isDiagram = activeTab?.type === 'diagram'
  const isChat = activeTab?.type === 'chat'
  const baseTitle = activeTab?.title ?? 'file'
  // Strip any existing extension for the default filename stem
  const stem = baseTitle.replace(/\.[^/.]+$/, '')

  const [filename, setFilename] = useState(stem)
  const [textFormat, setTextFormat] = useState<TextFormat>('txt')
  const [diagramFormat, setDiagramFormat] = useState<DiagramFormat>('json')
  const [chatFormat, setChatFormat] = useState<ChatFormat>('txt')
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
      } else if (isChat) {
        const messages = chatMessages[activeTab.id] ?? []
        const name = `${filename}.${chatFormat}`
        switch (chatFormat) {
          case 'txt':
            exportChatAsTxt(messages, name)
            break
          case 'json':
            exportChatAsJson(messages, name)
            break
          case 'docx':
            await exportChatAsDocx(messages, name)
            break
          case 'pdf':
            exportChatAsPdf(messages, name)
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

  const formats = isDiagram ? DIAGRAM_FORMATS : isChat ? CHAT_FORMATS : TEXT_FORMATS
  const selectedFormat = isDiagram ? diagramFormat : isChat ? chatFormat : textFormat

  function handleFormatSelect(value: string) {
    if (isDiagram) setDiagramFormat(value as DiagramFormat)
    else if (isChat) setChatFormat(value as ChatFormat)
    else setTextFormat(value as TextFormat)
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
          {formats.map((fmt) => {
            const selected = selectedFormat === fmt.value
            return (
              <li
                key={fmt.value}
                className={`${styles.formatItem} ${selected ? styles.formatItemSelected : ''}`}
                onClick={() => handleFormatSelect(fmt.value)}
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
