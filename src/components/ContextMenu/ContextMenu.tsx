import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import styles from './ContextMenu.module.css'

export interface ContextMenuAction {
  label: string
  onClick: () => void
  disabled?: boolean
}

export type ContextMenuEntry = ContextMenuAction | 'divider'

export interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuEntry[]
  onClose: () => void
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLUListElement>(null)

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Defer listener so the right-click that opened the menu doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleMouseDown)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [onClose])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Rough per-item height for off-screen adjustment
  const itemCount = items.filter((i) => i !== 'divider').length
  const dividerCount = items.filter((i) => i === 'divider').length
  const estimatedHeight = itemCount * 30 + dividerCount * 9 + 8
  const menuWidth = 180

  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 8)
  const adjustedY = Math.min(y, window.innerHeight - estimatedHeight - 8)

  return createPortal(
    <ul
      ref={ref}
      className={styles.contextMenu}
      style={{ left: adjustedX, top: adjustedY }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, i) =>
        item === 'divider' ? (
          <li key={`divider-${i}`} className={styles.divider} />
        ) : (
          <li
            key={`${item.label}-${i}`}
            className={item.disabled ? styles.itemDisabled : styles.item}
            onClick={() => {
              if (!item.disabled) {
                item.onClick()
                onClose()
              }
            }}
          >
            {item.label}
          </li>
        ),
      )}
    </ul>,
    document.body,
  )
}
