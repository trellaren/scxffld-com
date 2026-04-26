import { useEffect, useRef } from 'react'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { Schema, DOMParser } from 'prosemirror-model'
import { schema } from 'prosemirror-schema-basic'
import { addListNodes } from 'prosemirror-schema-list'
import { history, undo, redo } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap } from 'prosemirror-commands'
import 'prosemirror-view/style/prosemirror.css'
import styles from './ProseMirrorEditor.module.css'

const mySchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
  marks: schema.spec.marks,
})

export default function ProseMirrorEditor() {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    const content = document.createElement('div')
    content.innerHTML = '<p>Start typing here\u2026</p>'

    const state = EditorState.create({
      doc: DOMParser.fromSchema(mySchema).parse(content),
      plugins: [
        history(),
        keymap({ 'Mod-z': undo, 'Mod-y': redo }),
        keymap(baseKeymap),
      ],
    })

    viewRef.current = new EditorView(editorRef.current, { state })

    return () => {
      viewRef.current?.destroy()
    }
  }, [])

  return <div ref={editorRef} className={styles.editor} />
}
