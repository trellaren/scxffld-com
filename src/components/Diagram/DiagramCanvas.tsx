import { useCallback } from 'react'
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
} from 'reactflow'
import type { Connection } from 'reactflow'
import 'reactflow/dist/style.css'
import styles from './DiagramCanvas.module.css'

const initialNodes = [
  {
    id: '1',
    position: { x: 50, y: 50 },
    data: { label: 'Node 1' },
    style: { background: '#2d2d2d', color: '#d4d4d4', border: '1px solid #555' },
  },
  {
    id: '2',
    position: { x: 250, y: 150 },
    data: { label: 'Node 2' },
    style: { background: '#2d2d2d', color: '#d4d4d4', border: '1px solid #555' },
  },
]

const initialEdges = [{ id: 'e1-2', source: '1', target: '2', animated: true }]

export default function DiagramCanvas() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  )

  return (
    <div className={styles.canvas}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background color="#3c3c3c" />
        <Controls />
        <MiniMap
          style={{ background: '#1e1e1e' }}
          nodeColor="#555"
        />
      </ReactFlow>
    </div>
  )
}
