import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import type { EditorState } from 'prosemirror-state'
import type { Node as PmNode } from 'prosemirror-model'
import { RootState } from '../../store'
import { subscribeEditorState, getEditor } from '../../editorRegistry'
import type { PanelType } from '../../store/workspaceSlice'
import styles from './StatusBar.module.css'

interface DocStats {
  wordCount: number
  charCount: number
  lineCount: number
  blockType: string
}

const EMPTY_STATS: DocStats = {
  wordCount: 0,
  charCount: 0,
  lineCount: 0,
  blockType: 'Paragraph',
}

function countWords(doc: PmNode): number {
  let text = ''
  doc.descendants((node) => {
    if (node.isText && node.text) text += node.text + ' '
  })
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

function countChars(doc: PmNode): number {
  let count = 0
  doc.descendants((node) => {
    if (node.isText && node.text) count += node.text.length
  })
  return count
}

function countLines(doc: PmNode): number {
  let count = 0
  doc.descendants((node) => {
    if (node.isBlock && node.childCount >= 0 && node.type.name !== 'doc') count++
  })
  return count
}

function getBlockType(state: EditorState): string {
  const { from, to } = state.selection
  let blockType = 'Paragraph'
  state.doc.nodesBetween(from, to, (node) => {
    const name = node.type.name
    if (name === 'heading') {
      blockType = `Heading ${node.attrs.level as number}`
    } else if (name === 'code_block') {
      blockType = 'Code Block'
    } else if (name === 'bullet_list') {
      blockType = 'Bullet List'
    } else if (name === 'ordered_list') {
      blockType = 'Ordered List'
    }
  })
  return blockType
}

function computeStats(state: EditorState): DocStats {
  return {
    wordCount: countWords(state.doc),
    charCount: countChars(state.doc),
    lineCount: countLines(state.doc),
    blockType: getBlockType(state),
  }
}

function labelForType(type: PanelType): string {
  switch (type) {
    case 'editor':
      return 'Document'
    case 'diagram':
      return 'Diagram'
    default:
      return 'Empty'
  }
}

export default function StatusBar() {
  const rows = useSelector((state: RootState) => state.workspace.rows)
  const activePanelId = useSelector((state: RootState) => state.workspace.activePanelId)

  const [stats, setStats] = useState<DocStats>(EMPTY_STATS)
  const [activeTabType, setActiveTabType] = useState<PanelType>('empty')
  const [activeTabId, setActiveTabId] = useState<string | null>(null)

  // Derive active tab info from Redux state
  useEffect(() => {
    if (!activePanelId) {
      setActiveTabType('empty')
      setActiveTabId(null)
      return
    }
    for (const row of rows) {
      const panel = row.panels.find((p) => p.id === activePanelId)
      if (panel) {
        const tab = panel.tabs.find((t) => t.id === panel.activeTabId)
        if (tab) {
          setActiveTabType(tab.type)
          setActiveTabId(tab.id)
        } else {
          setActiveTabType('empty')
          setActiveTabId(null)
        }
        return
      }
    }
    setActiveTabType('empty')
    setActiveTabId(null)
  }, [rows, activePanelId])

  // Subscribe to editor state changes for live stats
  useEffect(() => {
    if (!activeTabId || activeTabType !== 'editor') {
      setStats(EMPTY_STATS)
      return
    }

    // Compute initial stats if editor is already mounted
    const view = getEditor(activeTabId)
    if (view) {
      setStats(computeStats(view.state))
    }

    const unsubscribe = subscribeEditorState((tabId, state) => {
      if (tabId === activeTabId) {
        setStats(computeStats(state))
      }
    })
    return unsubscribe
  }, [activeTabId, activeTabType])

  const isEditor = activeTabType === 'editor'

  return (
    <div className={styles.statusBar} role="status" aria-label="Document status">
      <div className={styles.left}>
        {isEditor && (
          <>
            <span className={styles.item} title="Word count">
              {stats.wordCount} {stats.wordCount === 1 ? 'word' : 'words'}
            </span>
            <span className={styles.divider} />
            <span className={styles.item} title="Character count">
              {stats.charCount} {stats.charCount === 1 ? 'char' : 'chars'}
            </span>
            <span className={styles.divider} />
            <span className={styles.item} title="Line / paragraph count">
              {stats.lineCount} {stats.lineCount === 1 ? 'line' : 'lines'}
            </span>
            <span className={styles.divider} />
            <span className={styles.item} title="Current block type">
              {stats.blockType}
            </span>
          </>
        )}
        {!isEditor && (
          <span className={styles.item}>{labelForType(activeTabType)}</span>
        )}
      </div>
      <div className={styles.right}>
        {isEditor && (
          <>
            <span className={styles.item} title="Document type">
              {labelForType(activeTabType)}
            </span>
            <span className={styles.divider} />
            <span className={styles.item} title="Font family">
              Sans-serif
            </span>
            <span className={styles.divider} />
            <span className={styles.item} title="Font size">
              14px
            </span>
            <span className={styles.divider} />
            <span className={styles.item} title="Line spacing">
              1.6 spacing
            </span>
            <span className={styles.divider} />
            <span className={styles.item} title="Margins">
              16px margins
            </span>
          </>
        )}
        {!isEditor && (
          <span className={styles.item}>{labelForType(activeTabType)}</span>
        )}
      </div>
    </div>
  )
}
