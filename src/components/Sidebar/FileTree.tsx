import { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import {
  selectNode,
  toggleFolder,
  addFile,
  addFolder,
  renameNode,
  deleteNode,
} from '../../store/fileTreeSlice'
import type { FileNode } from '../../store/fileTreeSlice'
import styles from './FileTree.module.css'

interface ContextMenuState {
  x: number
  y: number
  nodeId: string | null
  nodeType: 'file' | 'folder' | null
}

interface TreeNodeProps {
  node: FileNode
  depth: number
  renamingId: string | null
  onStartRename: (id: string) => void
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void
}

function TreeNode({
  node,
  depth,
  renamingId,
  onStartRename,
  onContextMenu,
}: TreeNodeProps) {
  const dispatch = useDispatch()
  const selectedId = useSelector((state: RootState) => state.fileTree.selectedId)
  const [renameValue, setRenameValue] = useState(node.name)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renamingId === node.id && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingId, node.id])

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    dispatch(selectNode(node.id))
    if (node.type === 'folder') {
      dispatch(toggleFolder(node.id))
    }
  }

  function handleRenameSubmit() {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== node.name) {
      dispatch(renameNode({ id: node.id, name: trimmed }))
    }
    onStartRename('')
  }

  function handleRenameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleRenameSubmit()
    } else if (e.key === 'Escape') {
      setRenameValue(node.name)
      onStartRename('')
    }
  }

  const isFolder = node.type === 'folder'
  const isSelected = selectedId === node.id
  const isRenaming = renamingId === node.id

  return (
    <li>
      <div
        className={`${styles.treeItem} ${isSelected ? styles.selected : ''}`}
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, node)}
      >
        <div className={styles.treeItemInner}>
          <span
            className={styles.indent}
            style={{ width: `${depth * 12}px` }}
          />
          {isFolder ? (
            <span className={`${styles.chevron} ${node.expanded ? styles.open : ''}`}>
              ▶
            </span>
          ) : (
            <span className={styles.chevronPlaceholder} />
          )}
          <span className={styles.icon}>{isFolder ? (node.expanded ? '📂' : '📁') : '📄'}</span>
          {isRenaming ? (
            <input
              ref={renameInputRef}
              className={styles.renameInput}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleRenameKeyDown}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={styles.label}>{node.name}</span>
          )}
        </div>
      </div>
      {isFolder && node.expanded && node.children && node.children.length > 0 && (
        <ul className={styles.children}>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              renamingId={renamingId}
              onStartRename={onStartRename}
              onContextMenu={onContextMenu}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function FileTree() {
  const dispatch = useDispatch()
  const root = useSelector((state: RootState) => state.fileTree.root)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [renamingId, setRenamingId] = useState<string>('')
  const contextMenuRef = useRef<HTMLUListElement>(null)

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  useEffect(() => {
    if (!contextMenu) return
    function handleClick() {
      closeContextMenu()
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [contextMenu, closeContextMenu])

  function handleContextMenu(e: React.MouseEvent, node: FileNode) {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id, nodeType: node.type })
  }

  function handleBackgroundContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId: null, nodeType: null })
  }

  function handleNewFile() {
    const name = window.prompt('New file name:')
    if (name?.trim()) {
      dispatch(
        addFile({
          parentId: contextMenu?.nodeType === 'folder' ? contextMenu.nodeId : null,
          name: name.trim(),
        }),
      )
    }
    closeContextMenu()
  }

  function handleNewFolder() {
    const name = window.prompt('New folder name:')
    if (name?.trim()) {
      dispatch(
        addFolder({
          parentId: contextMenu?.nodeType === 'folder' ? contextMenu.nodeId : null,
          name: name.trim(),
        }),
      )
    }
    closeContextMenu()
  }

  function handleRename() {
    if (contextMenu?.nodeId) {
      setRenamingId(contextMenu.nodeId)
    }
    closeContextMenu()
  }

  function handleDelete() {
    if (contextMenu?.nodeId) {
      dispatch(deleteNode(contextMenu.nodeId))
    }
    closeContextMenu()
  }

  return (
    <>
      <ul
        className={styles.tree}
        onContextMenu={handleBackgroundContextMenu}
        onClick={() => dispatch(selectNode(null))}
      >
        {root.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            renamingId={renamingId}
            onStartRename={(id) => setRenamingId(id)}
            onContextMenu={handleContextMenu}
          />
        ))}
      </ul>

      {contextMenu && (
        <ul
          ref={contextMenuRef}
          className={styles.contextMenu}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <li className={styles.contextMenuItem} onClick={handleNewFile}>
            New File
          </li>
          <li className={styles.contextMenuItem} onClick={handleNewFolder}>
            New Folder
          </li>
          {contextMenu.nodeId && (
            <>
              <li className={styles.contextMenuDivider} />
              <li className={styles.contextMenuItem} onClick={handleRename}>
                Rename
              </li>
              <li className={styles.contextMenuItem} onClick={handleDelete}>
                Delete
              </li>
            </>
          )}
        </ul>
      )}
    </>
  )
}
