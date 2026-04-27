import type { EditorView } from 'prosemirror-view'
import type { EditorState } from 'prosemirror-state'

const registry = new Map<string, EditorView>()

type StateChangeListener = (tabId: string, state: EditorState) => void
const stateListeners = new Set<StateChangeListener>()

export function registerEditor(tabId: string, view: EditorView): void {
  registry.set(tabId, view)
}

export function unregisterEditor(tabId: string): void {
  registry.delete(tabId)
}

export function getEditor(tabId: string): EditorView | undefined {
  return registry.get(tabId)
}

export function notifyEditorStateChange(tabId: string, state: EditorState): void {
  stateListeners.forEach((l) => l(tabId, state))
}

export function subscribeEditorState(listener: StateChangeListener): () => void {
  stateListeners.add(listener)
  return () => stateListeners.delete(listener)
}
