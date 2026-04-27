import { useEffect, useRef } from 'react'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { Plugin } from 'prosemirror-state'
import { DOMParser } from 'prosemirror-model'
import { history, undo, redo } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap, toggleMark } from 'prosemirror-commands'
import { wrapInList, liftListItem } from 'prosemirror-schema-list'
import 'prosemirror-view/style/prosemirror.css'
import styles from './ProseMirrorEditor.module.css'
import { registerEditor, unregisterEditor, notifyEditorStateChange } from '../../editorRegistry'
import { editorSchema } from './schema'
import EditorToolbar from './EditorToolbar'

interface ProseMirrorEditorProps {
  tabId: string
}

export default function ProseMirrorEditor({ tabId }: ProseMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    const content = document.createElement('div')
    content.innerHTML = '<p>Start typing here\u2026</p>'

    const state = EditorState.create({
      doc: DOMParser.fromSchema(editorSchema).parse(content),
      plugins: [
        history(),
        keymap({
          'Mod-z': undo,
          'Mod-y': redo,
          'Mod-b': toggleMark(editorSchema.marks.strong),
          'Mod-i': toggleMark(editorSchema.marks.em),
          'Mod-`': toggleMark(editorSchema.marks.code),
          'Shift-Ctrl-8': wrapInList(editorSchema.nodes.bullet_list),
          'Shift-Ctrl-9': wrapInList(editorSchema.nodes.ordered_list),
          'Shift-Tab': liftListItem(editorSchema.nodes.list_item),
        }),
        keymap(baseKeymap),
        new Plugin({
          view() {
            return {
              update(view) {
                notifyEditorStateChange(tabId, view.state)
              },
            }
          },
        }),
      ],
    })

    viewRef.current = new EditorView(editorRef.current, { state })
    registerEditor(tabId, viewRef.current)

    return () => {
      unregisterEditor(tabId)
      viewRef.current?.destroy()
    }
  }, [tabId])

  return (
    <div className={styles.editorWrapper}>
      <EditorToolbar viewRef={viewRef} />
      <div ref={editorRef} className={styles.editor} />
    </div>
  )
}
