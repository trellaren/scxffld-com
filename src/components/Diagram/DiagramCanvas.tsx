import React, { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
} from 'reactflow'
import type { Connection, Node, Edge, ReactFlowInstance } from 'reactflow'
import 'reactflow/dist/style.css'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { setDiagramData } from '../../store/workspaceSlice'
import DiagramObjectPalette from './DiagramObjectPalette'
import CloudIconPalette from './CloudIconPalette'
import IconNode from './IconNode'
import DiagramNodeTree from './DiagramNodeTree'
import ContextMenu from '../ContextMenu/ContextMenu'
import type { ContextMenuEntry } from '../ContextMenu/ContextMenu'
import { generateId } from '../../utils'
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

const DEFAULT_NODE_STYLE = { background: '#2d2d2d', color: '#d4d4d4', border: '1px solid #555' }

const nodeTypes = { iconNode: IconNode }

interface DiagramCanvasProps {
  tabId: string
}

interface ContextMenuState {
  x: number
  y: number
  items: ContextMenuEntry[]
}

interface EditNodeState {
  id: string
  label: string
}

// Approximate half-width / half-height of a default node used to centre the viewport
const NODE_CENTER_OFFSET_X = 60
const NODE_CENTER_OFFSET_Y = 20

export default function DiagramCanvas({ tabId }: DiagramCanvasProps) {
  const dispatch = useDispatch()
  const savedData = useSelector((state: RootState) => state.workspace.diagramData[tabId])
  const canvasRef = useRef<HTMLDivElement>(null)
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null)

  const [nodes, setNodes, onNodesChange] = useNodesState(
    savedData ? (savedData.nodes as Node[]) : defaultNodes,
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    savedData ? (savedData.edges as Edge[]) : defaultEdges,
  )

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [editNode, setEditNode] = useState<EditNodeState | null>(null)

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  )

  useEffect(() => {
    dispatch(setDiagramData({ tabId, data: { nodes, edges } }))
  }, [dispatch, tabId, nodes, edges])

  function handleAddNode(node: Node) {
    setNodes((nds) => [...nds, node])
  }

  function handleDeleteNode(nodeId: string) {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
  }

  function handleFocusNode(node: Node) {
    rfInstance?.setCenter(node.position.x + NODE_CENTER_OFFSET_X, node.position.y + NODE_CENTER_OFFSET_Y, { zoom: 1.5, duration: 400 })
  }

  function handlePaneContextMenu(event: React.MouseEvent) {
    event.preventDefault()
    const bounds = canvasRef.current?.getBoundingClientRect()
    const position = rfInstance
      ? rfInstance.project({
          x: event.clientX - (bounds?.left ?? 0),
          y: event.clientY - (bounds?.top ?? 0),
        })
      : { x: 100, y: 100 }
    const items: ContextMenuEntry[] = [
      {
        label: 'Add Node Here',
        onClick: () => {
          const id = generateId('node')
          setNodes((nds) => [
            ...nds,
            {
              id,
              position,
              data: { label: 'New Node' },
              style: DEFAULT_NODE_STYLE,
            },
          ])
        },
      },
    ]
    setContextMenu({ x: event.clientX, y: event.clientY, items })
  }

  function handleNodeContextMenu(event: React.MouseEvent, node: Node) {
    event.preventDefault()
    const items: ContextMenuEntry[] = [
      {
        label: 'Edit Label',
        onClick: () => setEditNode({ id: node.id, label: String(node.data?.label ?? '') }),
      },
      'divider',
      {
        label: 'Delete Node',
        onClick: () => handleDeleteNode(node.id),
      },
    ]
    setContextMenu({ x: event.clientX, y: event.clientY, items })
  }

  function handleNodeDoubleClick(_event: React.MouseEvent, node: Node) {
    setEditNode({ id: node.id, label: String(node.data?.label ?? '') })
  }

  function handleEditConfirm() {
    if (!editNode) return
    setNodes((nds) =>
      nds.map((n) =>
        n.id === editNode.id ? { ...n, data: { ...n.data, label: editNode.label } } : n,
      ),
    )
    setEditNode(null)
  }

  return (
    <div className={styles.canvasWrapper}>
      <DiagramNodeTree
        nodes={nodes}
        onDeleteNode={handleDeleteNode}
        onFocusNode={handleFocusNode}
      />
      <div className={styles.canvasArea}>
        <div className={styles.canvas} ref={canvasRef}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setRfInstance}
            onPaneContextMenu={handlePaneContextMenu}
            onNodeContextMenu={handleNodeContextMenu}
            onNodeDoubleClick={handleNodeDoubleClick}
            nodeTypes={nodeTypes}
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
        <DiagramObjectPalette onAddNode={handleAddNode} />
        <CloudIconPalette onAddNode={handleAddNode} />
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}

      {editNode && (
        <div className={styles.editOverlay} onClick={() => setEditNode(null)}>
          <div className={styles.editDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.editTitle}>Edit Node Label</div>
            <input
              className={styles.editInput}
              value={editNode.label}
              onChange={(e) => setEditNode({ ...editNode, label: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEditConfirm()
                if (e.key === 'Escape') setEditNode(null)
              }}
              autoFocus
            />
            <div className={styles.editActions}>
              <button className={styles.editCancel} onClick={() => setEditNode(null)}>
                Cancel
              </button>
              <button className={styles.editConfirm} onClick={handleEditConfirm}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
