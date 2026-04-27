import { useState } from 'react'
import type { Node } from 'reactflow'
import styles from './DiagramNodeTree.module.css'

interface DiagramNodeTreeProps {
  nodes: Node[]
  onDeleteNode: (nodeId: string) => void
  onFocusNode: (node: Node) => void
}

export default function DiagramNodeTree({ nodes, onDeleteNode, onFocusNode }: DiagramNodeTreeProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={`${styles.tree} ${collapsed ? styles.treeCollapsed : ''}`}>
      <button
        className={styles.toggleBtn}
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? 'Show node tree' : 'Hide node tree'}
        aria-label={collapsed ? 'Show node tree' : 'Hide node tree'}
      >
        <span className={styles.toggleIcon}>{collapsed ? '›' : '‹'}</span>
        {!collapsed && <span className={styles.toggleLabel}>Nodes</span>}
      </button>
      {!collapsed && (
        <div className={styles.nodeList}>
          {nodes.length === 0 ? (
            <div className={styles.empty}>No nodes</div>
          ) : (
            nodes.map((node) => {
              const label = String(node.data?.label ?? node.id)
              return (
                <div key={node.id} className={styles.nodeItem}>
                  <button
                    className={styles.nodeLabel}
                    onClick={() => onFocusNode(node)}
                    title={`Focus: ${label}`}
                  >
                    <span className={styles.nodeIcon}>▪</span>
                    <span className={styles.nodeName}>{label}</span>
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => onDeleteNode(node.id)}
                    title={`Delete "${label}"`}
                    aria-label={`Delete ${label}`}
                  >
                    ×
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
