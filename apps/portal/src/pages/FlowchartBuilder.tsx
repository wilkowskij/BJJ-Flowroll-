import React, { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  BackgroundVariant,
  Handle,
  Position,
  type NodeProps,
  type Connection,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ArrowsPointingInIcon,
} from '@heroicons/react/24/outline'
import type { Technique } from '@/api/techniques'
import { techniquesApi } from '@/api/techniques'
import { flowchartsApi } from '@/api/flowcharts'
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
        <p className="font-semibold text-text-primary text-sm mb-1.5 leading-tight">
          {technique.title}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <PositionChip position={technique.position} />
          <BeltBadge belt={technique.beltLevel} />
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary !border-0 !w-3 !h-3"
      />
    </div>
  )
}

const nodeTypes = { techniqueNode: TechniqueNode }

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

interface HistoryEntry {
  nodes: Node[]
  edges: Edge[]
}

const MAX_HISTORY = 50

function FlowchartBuilderInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [search, setSearch] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [isLoading, setIsLoading] = useState(true)
  const [techniques, setTechniques] = useState<Technique[]>([])
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { fitView } = useReactFlow()

  // History for undo/redo
  const historyRef = useRef<{ past: HistoryEntry[]; future: HistoryEntry[] }>({
    past: [],
    future: [],
  })
  const isRestoringRef = useRef(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const updateHistoryFlags = () => {
    setCanUndo(historyRef.current.past.length > 0)
    setCanRedo(historyRef.current.future.length > 0)
  }

  const pushHistory = useCallback((nodes: Node[], edges: Edge[]) => {
    if (isRestoringRef.current) return
    historyRef.current.past.push({ nodes, edges })
    if (historyRef.current.past.length > MAX_HISTORY) {
      historyRef.current.past.shift()
    }
    historyRef.current.future = []
    updateHistoryFlags()
  }, [])

  // Load flowchart and techniques on mount
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    Promise.all([flowchartsApi.getMyFlowchart(), techniquesApi.list()])
      .then(([flowchart, techniqueList]) => {
        if (cancelled) return
        isRestoringRef.current = true
        setNodes((flowchart.nodes as Node[]) ?? [])
        setEdges((flowchart.edges as Edge[]) ?? [])
        setTechniques(techniqueList)
        setTimeout(() => {
          isRestoringRef.current = false
          fitView({ padding: 0.2 })
        }, 50)
      })
      .catch(() => {
        if (!cancelled) setTechniques([])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const triggerAutosave = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    setSaveStatus('unsaved')
    autosaveTimer.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        await flowchartsApi.saveMyFlowchart({ nodes: currentNodes, edges: currentEdges })
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    }, 2000)
  }, [])

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Capture snapshot before the change
      const prevSnapshot = { nodes: nodes.slice(), edges: edges.slice() }
      onNodesChange(changes)
      if (!isRestoringRef.current) {
        pushHistory(prevSnapshot.nodes, prevSnapshot.edges)
        setNodes((nds) => {
          triggerAutosave(nds, edges)
          return nds
        })
      }
    },
    [nodes, edges, onNodesChange, pushHistory, triggerAutosave, setNodes],
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const prevSnapshot = { nodes: nodes.slice(), edges: edges.slice() }
      onEdgesChange(changes)
      if (!isRestoringRef.current) {
        pushHistory(prevSnapshot.nodes, prevSnapshot.edges)
        setEdges((eds) => {
          triggerAutosave(nodes, eds)
          return eds
        })
      }
    },
    [nodes, edges, onEdgesChange, pushHistory, triggerAutosave, setEdges],
  )

  const onConnect = useCallback(
    (params: Connection) => {
      pushHistory(nodes, edges)
      setEdges((eds) => {
        const newEdges = addEdge({ ...params, style: { stroke: '#1B4FD8' } }, eds)
        triggerAutosave(nodes, newEdges)
        return newEdges
      })
    },
    [nodes, edges, setEdges, pushHistory, triggerAutosave],
  )

  const undo = useCallback(() => {
    const entry = historyRef.current.past.pop()
    if (!entry) return
    historyRef.current.future.push({ nodes, edges })
    isRestoringRef.current = true
    setNodes(entry.nodes)
    setEdges(entry.edges)
    setTimeout(() => {
      isRestoringRef.current = false
      triggerAutosave(entry.nodes, entry.edges)
    }, 0)
    updateHistoryFlags()
  }, [nodes, edges, setNodes, setEdges, triggerAutosave])

  const redo = useCallback(() => {
    const entry = historyRef.current.future.pop()
    if (!entry) return
    historyRef.current.past.push({ nodes, edges })
    isRestoringRef.current = true
    setNodes(entry.nodes)
    setEdges(entry.edges)
    setTimeout(() => {
      isRestoringRef.current = false
      triggerAutosave(entry.nodes, entry.edges)
    }, 0)
    updateHistoryFlags()
  }, [nodes, edges, setNodes, setEdges, triggerAutosave])

  // Keyboard shortcuts: Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

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

      pushHistory(nodes, edges)
      const newNode: Node = {
        id: `n-${Date.now()}`,
        type: 'techniqueNode',
        position,
        data: { technique },
      }
      setNodes((nds) => {
        const updated = [...nds, newNode]
        triggerAutosave(updated, edges)
        return updated
      })
    },
    [nodes, edges, setNodes, pushHistory, triggerAutosave],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const handleManualSave = async () => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    setSaveStatus('saving')
    try {
      await flowchartsApi.saveMyFlowchart({ nodes, edges })
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
  }, [])

  const filteredTechniques = techniques.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()),
  )

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
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : filteredTechniques.length === 0 ? (
            <p className="text-text-muted text-xs text-center py-4">
              {search ? 'No techniques found' : 'No techniques in your library yet'}
            </p>
          ) : (
            filteredTechniques.map((technique) => (
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
            ))
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
          <Button
            size="sm"
            variant="ghost"
            title="Undo (Ctrl+Z)"
            onClick={undo}
            disabled={!canUndo}
          >
            <ArrowUturnLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            title="Redo (Ctrl+Y)"
            onClick={redo}
            disabled={!canRedo}
          >
            <ArrowUturnRightIcon className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-slate-700" />
          <Button
            size="sm"
            variant="ghost"
            title="Fit View"
            onClick={() => fitView({ padding: 0.2, duration: 300 })}
          >
            <ArrowsPointingInIcon className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-slate-700" />
          <Button size="sm" onClick={handleManualSave} isLoading={saveStatus === 'saving'}>
            Save
          </Button>
        </div>

        {/* Autosave indicator */}
        <div className="absolute top-3 right-3 z-10">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              saveStatus === 'saved'
                ? 'text-success bg-success/10'
                : saveStatus === 'saving'
                  ? 'text-text-muted bg-surface-elevated'
                  : saveStatus === 'error'
                    ? 'text-error bg-error/10'
                    : 'text-warning bg-warning/10'
            }`}
          >
            {saveStatus === 'saved'
              ? 'Saved'
              : saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'error'
                  ? 'Save failed'
                  : 'Unsaved'}
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
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            className="bg-bg"
          >
            <Background color="#334155" gap={24} size={1.5} variant={BackgroundVariant.Dots} />
            <Controls className="!bg-surface-elevated !border-slate-700" />
            <MiniMap className="!bg-surface-elevated !border-slate-700" nodeColor="#334155" />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}

export default function FlowchartBuilder() {
  return (
    <ReactFlowProvider>
      <FlowchartBuilderInner />
    </ReactFlowProvider>
  )
}
