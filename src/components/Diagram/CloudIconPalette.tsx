import { useState } from 'react'
import type { Node } from 'reactflow'
import { generateId } from '../../utils'
import { AWS_ICON_MAP, AZURE_ICON_MAP } from './iconMaps'
import styles from './CloudIconPalette.module.css'

interface CloudIconPaletteProps {
  onAddNode: (node: Node) => void
}

export default function CloudIconPalette({ onAddNode }: CloudIconPaletteProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [awsCollapsed, setAwsCollapsed] = useState(false)
  const [azureCollapsed, setAzureCollapsed] = useState(false)

  function handleAddNode(iconName: string, iconType: 'aws' | 'azure') {
    const node: Node = {
      id: generateId('node'),
      position: { x: 80 + Math.random() * 200, y: 80 + Math.random() * 150 },
      data: { label: iconName, iconType, iconName },
      type: 'iconNode',
    }
    onAddNode(node)
  }

  return (
    <div className={styles.palette}>
      <button
        className={styles.toggleBtn}
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? 'Show cloud icons' : 'Hide cloud icons'}
        aria-label={collapsed ? 'Show cloud icons' : 'Hide cloud icons'}
      >
        <span className={styles.toggleIcon}>{collapsed ? '▴' : '▾'}</span>
        <span className={styles.toggleLabel}>Cloud Icons</span>
      </button>

      {!collapsed && (
        <>
          <div className={styles.section}>
            <button
              className={styles.sectionToggleBtn}
              onClick={() => setAwsCollapsed((c) => !c)}
              aria-label={awsCollapsed ? 'Show AWS icons' : 'Hide AWS icons'}
            >
              <span className={styles.sectionToggleIcon}>{awsCollapsed ? '▸' : '▾'}</span>
              <span className={styles.sectionLabel}>AWS</span>
            </button>
            {!awsCollapsed && (
              <div className={styles.iconGrid}>
                {Object.entries(AWS_ICON_MAP).map(([name, IconComponent]) => (
                  <button
                    key={name}
                    className={styles.iconBtn}
                    onClick={() => handleAddNode(name, 'aws')}
                    title={`Add ${name}`}
                    aria-label={`Add AWS ${name}`}
                  >
                    <div className={styles.iconWrapper}>
                      <IconComponent size={24} />
                    </div>
                    <span className={styles.iconLabel}>{name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <button
              className={styles.sectionToggleBtn}
              onClick={() => setAzureCollapsed((c) => !c)}
              aria-label={azureCollapsed ? 'Show Azure icons' : 'Hide Azure icons'}
            >
              <span className={styles.sectionToggleIcon}>{azureCollapsed ? '▸' : '▾'}</span>
              <span className={styles.sectionLabel}>Azure</span>
            </button>
            {!azureCollapsed && (
              <div className={styles.iconGrid}>
                {Object.entries(AZURE_ICON_MAP).map(([name, IconComponent]) => (
                  <button
                    key={name}
                    className={styles.iconBtn}
                    onClick={() => handleAddNode(name, 'azure')}
                    title={`Add ${name}`}
                    aria-label={`Add Azure ${name}`}
                  >
                    <div className={styles.iconWrapper}>
                      <IconComponent size={24} />
                    </div>
                    <span className={styles.iconLabel}>{name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
