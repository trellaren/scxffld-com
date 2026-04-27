import React, { useCallback, useEffect, useState } from 'react'
import type { EditorView } from 'prosemirror-view'
import { toggleMark, setBlockType } from 'prosemirror-commands'
import { wrapInList, liftListItem } from 'prosemirror-schema-list'
import { editorSchema } from './schema'
import styles from './EditorToolbar.module.css'

interface EditorToolbarProps {
  viewRef: React.RefObject<EditorView | null>
}

function isMarkActive(view: EditorView, markName: string): boolean {
  const { from, $from, to, empty } = view.state.selection
  const markType = editorSchema.marks[markName]
  if (!markType) return false
  if (empty) {
    return !!markType.isInSet(view.state.storedMarks ?? $from.marks())
  }
  return view.state.doc.rangeHasMark(from, to, markType)
}

function isBlockType(view: EditorView, nodeType: string, attrs?: Record<string, unknown>): boolean {
  const { from, to } = view.state.selection
  const type = editorSchema.nodes[nodeType]
  if (!type) return false
  let found = false
  view.state.doc.nodesBetween(from, to, (node) => {
    if (node.type === type) {
      if (!attrs || Object.keys(attrs).every((key) => node.attrs[key] === attrs[key])) {
        found = true
      }
    }
  })
  return found
}

interface ToolbarState {
  bold: boolean
  italic: boolean
  code: boolean
  h1: boolean
  h2: boolean
  h3: boolean
  bulletList: boolean
  orderedList: boolean
}

const defaultState: ToolbarState = {
  bold: false,
  italic: false,
  code: false,
  h1: false,
  h2: false,
  h3: false,
  bulletList: false,
  orderedList: false,
}

export default function EditorToolbar({ viewRef }: EditorToolbarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [markState, setMarkState] = useState<ToolbarState>(defaultState)

  const refreshState = useCallback(() => {
    const view = viewRef.current
    if (!view) return
    setMarkState({
      bold: isMarkActive(view, 'strong'),
      italic: isMarkActive(view, 'em'),
      code: isMarkActive(view, 'code'),
      h1: isBlockType(view, 'heading', { level: 1 }),
      h2: isBlockType(view, 'heading', { level: 2 }),
      h3: isBlockType(view, 'heading', { level: 3 }),
      bulletList: isBlockType(view, 'bullet_list'),
      orderedList: isBlockType(view, 'ordered_list'),
    })
  }, [viewRef])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const originalUpdateState = view.updateState.bind(view)
    view.updateState = (state) => {
      originalUpdateState(state)
      refreshState()
    }
    return () => {
      if (viewRef.current) {
        viewRef.current.updateState = originalUpdateState
      }
    }
  }, [viewRef, refreshState])

  function run(command: (view: EditorView) => boolean) {
    const view = viewRef.current
    if (!view) return
    command(view)
    view.focus()
    refreshState()
  }

  function handleToggleMark(markName: string) {
    const markType = editorSchema.marks[markName]
    if (!markType) return
    run((view) => toggleMark(markType)(view.state, view.dispatch))
  }

  function handleSetBlock(nodeType: string, attrs?: Record<string, unknown>) {
    const type = editorSchema.nodes[nodeType]
    if (!type) return
    run((view) =>
      setBlockType(type, attrs)(view.state, view.dispatch),
    )
  }

  function handleWrapInList(nodeType: string) {
    const type = editorSchema.nodes[nodeType]
    if (!type) return
    run((view) => wrapInList(type)(view.state, view.dispatch))
  }

  function handleLiftList() {
    const itemType = editorSchema.nodes['list_item']
    if (!itemType) return
    run((view) => liftListItem(itemType)(view.state, view.dispatch))
  }

  return (
    <div className={styles.toolbar}>
      <button
        className={`${styles.toggleBtn} ${collapsed ? styles.toggleBtnCollapsed : ''}`}
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? 'Show formatting toolbar' : 'Hide formatting toolbar'}
        aria-label={collapsed ? 'Show formatting toolbar' : 'Hide formatting toolbar'}
      >
        <span className={styles.toggleIcon}>{collapsed ? '▸' : '▾'}</span>
        <span className={styles.toggleLabel}>Format</span>
      </button>
      {!collapsed && (
        <div className={styles.toolbarButtons}>
          <div className={styles.group}>
            <button
              className={`${styles.btn} ${markState.bold ? styles.btnActive : ''}`}
              onClick={() => handleToggleMark('strong')}
              title="Bold (Ctrl+B)"
              aria-label="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              className={`${styles.btn} ${markState.italic ? styles.btnActive : ''}`}
              onClick={() => handleToggleMark('em')}
              title="Italic (Ctrl+I)"
              aria-label="Italic"
            >
              <em>I</em>
            </button>
            <button
              className={`${styles.btn} ${markState.code ? styles.btnActive : ''}`}
              onClick={() => handleToggleMark('code')}
              title="Inline Code"
              aria-label="Inline Code"
            >
              {'</>'}
            </button>
          </div>
          <div className={styles.separator} />
          <div className={styles.group}>
            <button
              className={`${styles.btn} ${markState.h1 ? styles.btnActive : ''}`}
              onClick={() =>
                markState.h1
                  ? handleSetBlock('paragraph')
                  : handleSetBlock('heading', { level: 1 })
              }
              title="Heading 1"
              aria-label="Heading 1"
            >
              H1
            </button>
            <button
              className={`${styles.btn} ${markState.h2 ? styles.btnActive : ''}`}
              onClick={() =>
                markState.h2
                  ? handleSetBlock('paragraph')
                  : handleSetBlock('heading', { level: 2 })
              }
              title="Heading 2"
              aria-label="Heading 2"
            >
              H2
            </button>
            <button
              className={`${styles.btn} ${markState.h3 ? styles.btnActive : ''}`}
              onClick={() =>
                markState.h3
                  ? handleSetBlock('paragraph')
                  : handleSetBlock('heading', { level: 3 })
              }
              title="Heading 3"
              aria-label="Heading 3"
            >
              H3
            </button>
          </div>
          <div className={styles.separator} />
          <div className={styles.group}>
            <button
              className={`${styles.btn} ${markState.bulletList ? styles.btnActive : ''}`}
              onClick={() =>
                markState.bulletList ? handleLiftList() : handleWrapInList('bullet_list')
              }
              title="Bullet List"
              aria-label="Bullet List"
            >
              ≡
            </button>
            <button
              className={`${styles.btn} ${markState.orderedList ? styles.btnActive : ''}`}
              onClick={() =>
                markState.orderedList ? handleLiftList() : handleWrapInList('ordered_list')
              }
              title="Ordered List"
              aria-label="Ordered List"
            >
              №
            </button>
          </div>
          <div className={styles.separator} />
          <div className={styles.group}>
            <button
              className={styles.btn}
              onClick={() => handleSetBlock('paragraph')}
              title="Normal paragraph"
              aria-label="Normal paragraph"
            >
              ¶
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
