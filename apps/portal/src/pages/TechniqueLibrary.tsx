import React, { useState, useMemo, useEffect } from 'react'
import { MagnifyingGlassIcon, PlayIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { PlusIcon } from '@heroicons/react/24/solid'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { mockTechniques } from '@/api/mockData'
import type { Technique, Position, TechniqueType } from '@/api/techniques'
import type { Belt } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { BeltBadge, PositionChip } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { VideoUpload } from '@/components/ui/VideoUpload'

const techniqueSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  position: z.enum(['guard', 'mount', 'back', 'side_control', 'standing'] as const),
  beltLevel: z.enum(['white', 'blue', 'purple', 'brown', 'black'] as const),
  type: z.enum(['submission', 'sweep', 'escape', 'pass', 'takedown', 'transition'] as const),
  difficulty: z.coerce.number().min(1).max(5).int(),
  videoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type TechniqueFormData = z.infer<typeof techniqueSchema>

interface TechniqueCardProps {
  technique: Technique
  onEdit: (t: Technique) => void
  onDelete: (id: string) => void
}

function TechniqueCard({ technique, onEdit, onDelete }: TechniqueCardProps) {
  return (
    <div className="bg-surface-card rounded-xl overflow-hidden border border-slate-700 hover:border-slate-500 transition-colors group">
      {/* Thumbnail */}
      <div className="aspect-video bg-slate-800 relative flex items-center justify-center">
        {technique.thumbnailUrl ? (
          <img src={technique.thumbnailUrl} alt={technique.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-text-muted">
            <PlayIcon className="h-10 w-10 opacity-40" />
            <span className="text-xs">No video</span>
          </div>
        )}
        {/* Hover actions */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(technique)}
            className="p-1.5 bg-surface-elevated/90 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
            title="Edit"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(technique.id)}
            className="p-1.5 bg-surface-elevated/90 rounded-lg text-text-secondary hover:text-error transition-colors"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-text-primary text-sm mb-2 truncate">{technique.title}</h3>
        <p className="text-text-muted text-xs mb-3 line-clamp-2">{technique.description}</p>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <PositionChip position={technique.position} />
          <BeltBadge belt={technique.beltLevel} />
        </div>
        {/* Difficulty dots */}
        <div className="flex items-center gap-1">
          <span className="text-text-muted text-xs mr-1">Difficulty:</span>
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i < technique.difficulty ? 'bg-primary' : 'bg-slate-700'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function TechniqueLibrary() {
  const [techniques, setTechniques] = useState<Technique[]>(mockTechniques)
  const [search, setSearch] = useState('')
  const [filterPosition, setFilterPosition] = useState<Position | 'all'>('all')
  const [filterBelt, setFilterBelt] = useState<Belt | 'all'>('all')
  const [filterType, setFilterType] = useState<TechniqueType | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTechnique, setEditingTechnique] = useState<Technique | null>(null)
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TechniqueFormData>({
    resolver: zodResolver(techniqueSchema),
    defaultValues: { difficulty: 3 },
  })

  const filtered = useMemo(() => {
    return techniques.filter((t) => {
      const matchSearch = t.title.toLowerCase().includes(search.toLowerCase())
      const matchPos = filterPosition === 'all' || t.position === filterPosition
      const matchBelt = filterBelt === 'all' || t.beltLevel === filterBelt
      const matchType = filterType === 'all' || t.type === filterType
      return matchSearch && matchPos && matchBelt && matchType
    })
  }, [techniques, search, filterPosition, filterBelt, filterType])

  const openAdd = () => {
    setEditingTechnique(null)
    setUploadedVideoUrl(null)
    reset({ difficulty: 3, title: '', description: '', videoUrl: '' })
    setIsModalOpen(true)
  }

  const openEdit = (t: Technique) => {
    setEditingTechnique(t)
    setUploadedVideoUrl(null)
    reset({
      title: t.title,
      description: t.description,
      position: t.position,
      beltLevel: t.beltLevel,
      type: t.type,
      difficulty: t.difficulty,
      videoUrl: t.videoUrl ?? '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setTechniques((prev) => prev.filter((t) => t.id !== id))
  }

  const onSubmit = (data: TechniqueFormData) => {
    if (editingTechnique) {
      setTechniques((prev) =>
        prev.map((t) =>
          t.id === editingTechnique.id
            ? { ...t, ...data, videoUrl: uploadedVideoUrl ?? data.videoUrl ?? null, updatedAt: new Date().toISOString() }
            : t,
        ),
      )
    } else {
      const newTech: Technique = {
        id: `tech-${Date.now()}`,
        gymId: 'gym-1',
        ...data,
        videoUrl: uploadedVideoUrl ?? data.videoUrl ?? null,
        thumbnailUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setTechniques((prev) => [newTech, ...prev])
    }
    setIsModalOpen(false)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">Technique Library</h1>
          <p className="text-text-secondary text-sm mt-0.5">{techniques.length} techniques</p>
        </div>
        <Button onClick={openAdd} leftIcon={<PlusIcon className="h-4 w-4" />}>
          Add Technique
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search techniques..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
          />
        </div>
        <select
          value={filterPosition}
          onChange={(e) => setFilterPosition(e.target.value as Position | 'all')}
          className="bg-surface-elevated border border-slate-600 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Positions</option>
          <option value="guard">Guard</option>
          <option value="mount">Mount</option>
          <option value="back">Back</option>
          <option value="side_control">Side Control</option>
          <option value="standing">Standing</option>
        </select>
        <select
          value={filterBelt}
          onChange={(e) => setFilterBelt(e.target.value as Belt | 'all')}
          className="bg-surface-elevated border border-slate-600 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Belts</option>
          <option value="white">White</option>
          <option value="blue">Blue</option>
          <option value="purple">Purple</option>
          <option value="brown">Brown</option>
          <option value="black">Black</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as TechniqueType | 'all')}
          className="bg-surface-elevated border border-slate-600 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Types</option>
          <option value="submission">Submission</option>
          <option value="sweep">Sweep</option>
          <option value="escape">Escape</option>
          <option value="pass">Pass</option>
          <option value="takedown">Takedown</option>
          <option value="transition">Transition</option>
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No techniques found"
          description="No techniques yet. Add your first technique to get started."
          actionLabel="Add Technique"
          onAction={openAdd}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((t) => (
            <TechniqueCard
              key={t.id}
              technique={t}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTechnique ? 'Edit Technique' : 'Add Technique'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)}>
              {editingTechnique ? 'Save Changes' : 'Add Technique'}
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g. Armbar from Guard"
            error={errors.title?.message}
            {...register('title')}
          />
          <Textarea
            label="Description"
            placeholder="Describe the technique..."
            rows={3}
            error={errors.description?.message}
            {...register('description')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Position" error={errors.position?.message} {...register('position')}>
              <option value="">Select position</option>
              <option value="guard">Guard</option>
              <option value="mount">Mount</option>
              <option value="back">Back</option>
              <option value="side_control">Side Control</option>
              <option value="standing">Standing</option>
            </Select>
            <Select label="Belt Level" error={errors.beltLevel?.message} {...register('beltLevel')}>
              <option value="">Select belt</option>
              <option value="white">White</option>
              <option value="blue">Blue</option>
              <option value="purple">Purple</option>
              <option value="brown">Brown</option>
              <option value="black">Black</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" error={errors.type?.message} {...register('type')}>
              <option value="">Select type</option>
              <option value="submission">Submission</option>
              <option value="sweep">Sweep</option>
              <option value="escape">Escape</option>
              <option value="pass">Pass</option>
              <option value="takedown">Takedown</option>
              <option value="transition">Transition</option>
            </Select>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Difficulty (1–5)
              </label>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                className="w-full accent-primary"
                {...register('difficulty')}
                onChange={(e) => setValue('difficulty', parseInt(e.target.value))}
              />
            </div>
          </div>
          <Input
            label="Video URL (optional)"
            placeholder="https://youtube.com/..."
            error={errors.videoUrl?.message}
            {...register('videoUrl')}
          />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Or upload a video file
            </label>
            <VideoUpload
              techniqueId={editingTechnique?.id}
              currentVideoUrl={uploadedVideoUrl ?? undefined}
              onUploadComplete={(url) => {
                setUploadedVideoUrl(url)
              }}
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
