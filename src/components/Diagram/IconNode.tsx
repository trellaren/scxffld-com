import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'
import { AWS_ICON_MAP, AZURE_ICON_MAP } from './iconMaps'
import styles from './IconNode.module.css'

interface IconNodeData {
  label: string
  iconType: 'aws' | 'azure'
  iconName: string
}

export default function IconNode({ data }: NodeProps<IconNodeData>) {
  const map = data.iconType === 'aws' ? AWS_ICON_MAP : AZURE_ICON_MAP
  const IconComponent = map[data.iconName]

  return (
    <div className={styles.iconNode}>
      <Handle type="target" position={Position.Top} />
      <div className={styles.iconWrapper}>
        {IconComponent ? <IconComponent size={32} /> : <span>?</span>}
      </div>
      <div className={styles.label}>{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
