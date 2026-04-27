import { useCallback, useEffect } from 'react'
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
} from 'reactflow'
import type { Connection, Node, Edge } from 'reactflow'
import 'reactflow/dist/style.css'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { setDiagramData } from '../../store/workspaceSlice'
import styles from './DiagramCanvas.module.css'

const defaultNodes: Node[] = [
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

const defaultEdges: Edge[] = [{ id: 'e1-2', source: '1', target: '2', animated: true }]

interface DiagramCanvasProps {
  tabId: string
}

export default function DiagramCanvas({ tabId }: DiagramCanvasProps) {
  const dispatch = useDispatch()
  const savedData = useSelector((state: RootState) => state.workspace.diagramData[tabId])

  const [nodes, , onNodesChange] = useNodesState(
    savedData ? (savedData.nodes as Node[]) : defaultNodes,
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    savedData ? (savedData.edges as Edge[]) : defaultEdges,
  )

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  )

  useEffect(() => {
    dispatch(setDiagramData({ tabId, data: { nodes, edges } }))
  }, [dispatch, tabId, nodes, edges])

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
