import React, { useState } from 'react'
import type { Node } from 'reactflow'
import { generateId } from '../../utils'
import styles from './DiagramObjectPalette.module.css'

interface PaletteItem {
  label: string
  shape: string
  description: string
  nodeStyle: React.CSSProperties
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    label: 'Rectangle',
    shape: 'rectangle',
    description: 'General-purpose box',
    nodeStyle: { background: '#2d2d2d', color: '#d4d4d4', border: '1px solid #555', borderRadius: 4 },
  },
  {
    label: 'Rounded',
    shape: 'rounded',
    description: 'Rounded rectangle',
    nodeStyle: { background: '#2d2d2d', color: '#d4d4d4', border: '1px solid #555', borderRadius: 16 },
  },
  {
    label: 'Circle',
    shape: 'circle',
    description: 'Circular node',
    nodeStyle: {
      background: '#2d2d2d',
      color: '#d4d4d4',
      border: '1px solid #555',
      borderRadius: '50%',
      width: 60,
      height: 60,
    },
  },
  {
    label: 'Diamond',
    shape: 'diamond',
    description: 'Decision / condition',
    nodeStyle: {
      background: '#2d2d2d',
      color: '#d4d4d4',
      border: '1px solid #555',
      transform: 'rotate(45deg)',
    },
  },
  {
    label: 'Parallelogram',
    shape: 'parallelogram',
    description: 'Input / output',
    nodeStyle: {
      background: '#2d2d2d',
      color: '#d4d4d4',
      border: '1px solid #555',
      transform: 'skewX(-12deg)',
    },
  },
  {
    label: 'Cylinder',
    shape: 'cylinder',
    description: 'Database / storage',
    nodeStyle: {
      background: '#2d2d2d',
      color: '#d4d4d4',
      border: '1px solid #555',
      borderRadius: '8px / 16px',
    },
  },
  {
    label: 'Note',
    shape: 'note',
    description: 'Annotation note',
    nodeStyle: {
      background: '#3a3a1a',
      color: '#d4d4a0',
      border: '1px solid #888855',
      borderRadius: 2,
    },
  },
  {
    label: 'Start',
    shape: 'start',
    description: 'Start / end terminal',
    nodeStyle: {
      background: '#1a3a1a',
      color: '#80d480',
      border: '1px solid #558855',
      borderRadius: 20,
    },
  },
  {
    label: 'Process',
    shape: 'process',
    description: 'Process step',
    nodeStyle: { background: '#1a2a3a', color: '#80b4d4', border: '1px solid #3a6a9a', borderRadius: 4 },
  },
]

interface DiagramObjectPaletteProps {
  onAddNode: (node: Node) => void
}

export default function DiagramObjectPalette({ onAddNode }: DiagramObjectPaletteProps) {
  const [collapsed, setCollapsed] = useState(false)

  function handleAddNode(item: PaletteItem) {
    const id = generateId('node')
    const newNode: Node = {
      id,
      position: {
        x: 80 + Math.random() * 200,
        y: 80 + Math.random() * 150,
      },
      data: { label: item.label },
      style: item.nodeStyle,
    }
    onAddNode(newNode)
  }

  return (
    <div className={styles.palette}>
      <button
        className={styles.toggleBtn}
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? 'Show object palette' : 'Hide object palette'}
        aria-label={collapsed ? 'Show object palette' : 'Hide object palette'}
      >
        <span className={styles.toggleIcon}>{collapsed ? '▴' : '▾'}</span>
        <span className={styles.toggleLabel}>Objects</span>
      </button>
      {!collapsed && (
        <div className={styles.itemList}>
          {PALETTE_ITEMS.map((item) => (
            <button
              key={item.shape}
              className={styles.item}
              onClick={() => handleAddNode(item)}
              title={item.description}
              aria-label={`Add ${item.label}`}
            >
              <div className={styles.itemPreview}>
                <div className={styles.itemShape} style={item.nodeStyle} />
              </div>
              <span className={styles.itemLabel}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
