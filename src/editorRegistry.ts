import type { EditorView } from 'prosemirror-view'

const registry = new Map<string, EditorView>()

export function registerEditor(tabId: string, view: EditorView): void {
  registry.set(tabId, view)
}

export function unregisterEditor(tabId: string): void {
  registry.delete(tabId)
}

export function getEditor(tabId: string): EditorView | undefined {
  return registry.get(tabId)
}
