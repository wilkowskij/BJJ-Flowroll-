import React, { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Handle,
  Position,
  type NodeProps,
  type Connection,
  type Node,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { ArrowUturnLeftIcon, ArrowUturnRightIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline'
import { mockTechniques } from '@/api/mockData'
import type { Technique } from '@/api/techniques'
import { BeltBadge, PositionChip } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const beltBorderColors: Record<string, string> = {
  white: '#F8FAFC',
  blue: '#3B82F6',
  purple: '#A855F7',
  brown: '#92400E',
  black: '#1F2937',
}

interface TechniqueNodeData {
  technique: Technique
}

function TechniqueNode({ data }: NodeProps<TechniqueNodeData>) {
  const { technique } = data
  const borderColor = beltBorderColors[technique.beltLevel] ?? '#475569'

  return (
    <div
      className="bg-surface-card rounded-lg border border-slate-600 min-w-[180px] max-w-[220px] shadow-lg"
      style={{ borderLeftColor: borderColor, borderLeftWidth: 4 }}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !border-0 !w-3 !h-3" />
      <div className="p-3">
        <p className="font-semibold text-text-primary text-sm mb-1.5 leading-tight">{technique.title}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <PositionChip position={technique.position} />
          <BeltBadge belt={technique.beltLevel} />
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-primary !border-0 !w-3 !h-3" />
    </div>
  )
}

const nodeTypes = { techniqueNode: TechniqueNode }

// Initial mock flowchart data
const initialNodes: Node[] = [
  {
    id: 'n1',
    type: 'techniqueNode',
    position: { x: 200, y: 50 },
    data: { technique: mockTechniques[0] },
  },
  {
    id: 'n2',
    type: 'techniqueNode',
    position: { x: 50, y: 200 },
    data: { technique: mockTechniques[1] },
  },
  {
    id: 'n3',
    type: 'techniqueNode',
    position: { x: 350, y: 200 },
    data: { technique: mockTechniques[2] },
  },
  {
    id: 'n4',
    type: 'techniqueNode',
    position: { x: 200, y: 350 },
    data: { technique: mockTechniques[0] },
  },
]

const initialEdges = [
  { id: 'e1-2', source: 'n1', target: 'n2', animated: true, style: { stroke: '#1B4FD8' } },
  { id: 'e1-3', source: 'n1', target: 'n3', animated: true, style: { stroke: '#1B4FD8' } },
  { id: 'e2-4', source: 'n2', target: 'n4', style: { stroke: '#475569' } },
]

type SaveStatus = 'saved' | 'saving' | 'unsaved'

export default function FlowchartBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [search, setSearch] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [isLoading] = useState(false)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filteredTechniques = mockTechniques.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()),
  )

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => addEdge({ ...params, style: { stroke: '#1B4FD8' } }, eds)),
    [setEdges],
  )

  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes)
      setSaveStatus('unsaved')
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
      autosaveTimer.current = setTimeout(() => {
        setSaveStatus('saving')
        setTimeout(() => setSaveStatus('saved'), 800)
      }, 2000)
    },
    [onNodesChange],
  )

  const handleSave = () => {
    setSaveStatus('saving')
    // Simulate API call
    setTimeout(() => setSaveStatus('saved'), 800)
  }

  const onDragStart = (event: React.DragEvent, technique: Technique) => {
    event.dataTransfer.setData('application/technique', JSON.stringify(technique))
    event.dataTransfer.effectAllowed = 'move'
  }

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const data = event.dataTransfer.getData('application/technique')
      if (!data) return

      const technique = JSON.parse(data) as Technique
      const wrapper = reactFlowWrapper.current
      if (!wrapper) return

      const bounds = wrapper.getBoundingClientRect()
      const position = {
        x: event.clientX - bounds.left - 90,
        y: event.clientY - bounds.top - 40,
      }

      const newNode: Node = {
        id: `n-${Date.now()}`,
        type: 'techniqueNode',
        position,
        data: { technique },
      }
      setNodes((nds) => [...nds, newNode])
      setSaveStatus('unsaved')
    },
    [setNodes],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
  }, [])

  return (
    <div className="h-[calc(100vh-56px)] flex overflow-hidden">
      {/* Left panel — technique list */}
      <div className="w-70 min-w-[280px] bg-surface-elevated border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <p className="text-text-primary font-semibold text-sm mb-3">Techniques</p>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredTechniques.map((technique) => (
            <div
              key={technique.id}
              draggable
              onDragStart={(e) => onDragStart(e, technique)}
              className="bg-surface-card rounded-lg p-3 cursor-grab active:cursor-grabbing border border-slate-700 hover:border-slate-500 transition-colors"
            >
              <p className="text-text-primary text-xs font-semibold mb-1.5">{technique.title}</p>
              <div className="flex items-center gap-1 flex-wrap">
                <PositionChip position={technique.position} />
                <BeltBadge belt={technique.beltLevel} />
              </div>
            </div>
          ))}
          {filteredTechniques.length === 0 && (
            <p className="text-text-muted text-xs text-center py-4">No techniques found</p>
          )}
        </div>
        <div className="p-3 border-t border-slate-700">
          <p className="text-text-muted text-xs text-center">Drag techniques onto the canvas</p>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex flex-col relative">
        {/* Canvas toolbar */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-surface-elevated/95 backdrop-blur rounded-xl border border-slate-700 px-3 py-2 shadow-lg">
          <Button size="sm" variant="ghost" title="Undo">
            <ArrowUturnLeftIcon className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" title="Redo">
            <ArrowUturnRightIcon className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-slate-700" />
          <Button size="sm" variant="ghost" title="Fit View">
            <ArrowsPointingInIcon className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-slate-700" />
          <Button size="sm" onClick={handleSave} isLoading={saveStatus === 'saving'}>
            Save
          </Button>
        </div>

        {/* Autosave indicator */}
        <div className="absolute top-3 right-3 z-10">
          <span className={`text-xs px-2 py-1 rounded-full ${
            saveStatus === 'saved'
              ? 'text-success bg-success/10'
              : saveStatus === 'saving'
              ? 'text-text-muted bg-surface-elevated'
              : 'text-warning bg-warning/10'
          }`}>
            {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
          </span>
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-bg/50">
            <LoadingSpinner size="lg" />
          </div>
        )}

        <div ref={reactFlowWrapper} className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            className="bg-bg"
          >
            <Background
              color="#334155"
              gap={24}
              size={1.5}
              variant={BackgroundVariant.Dots}
            />
            <Controls className="!bg-surface-elevated !border-slate-700" />
            <MiniMap
              className="!bg-surface-elevated !border-slate-700"
              nodeColor="#334155"
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}
