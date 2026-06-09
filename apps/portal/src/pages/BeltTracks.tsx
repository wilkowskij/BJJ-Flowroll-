import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PencilSquareIcon, CheckIcon } from '@heroicons/react/24/outline'
import { apiClient } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const BELT_LEVELS = ['white', 'blue', 'purple', 'brown', 'black'] as const
type BeltLevel = (typeof BELT_LEVELS)[number]

const BELT_COLORS: Record<BeltLevel, string> = {
  white: '#F1F5F9',
  blue: '#3B82F6',
  purple: '#A855F7',
  brown: '#92400E',
  black: '#334155',
}

interface BeltTrack {
  beltLevel: BeltLevel
  requiredClasses: number
  requiredTechniqueIds: string[]
  unlockCriteria: string | null
}

const trackSchema = z.object({
  requiredClasses: z.coerce.number().min(0).int(),
  unlockCriteria: z.string().optional(),
})

type TrackForm = z.infer<typeof trackSchema>

interface TrackEditorProps {
  belt: BeltLevel
  track: BeltTrack | null
  onSave: (belt: BeltLevel, data: TrackForm) => Promise<void>
}

function TrackEditor({ belt, track, onSave }: TrackEditorProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TrackForm>({
    resolver: zodResolver(trackSchema),
    defaultValues: {
      requiredClasses: track?.requiredClasses ?? 0,
      unlockCriteria: track?.unlockCriteria ?? '',
    },
  })

  const onSubmit = async (data: TrackForm) => {
    setSaving(true)
    try {
      await onSave(belt, data)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const beltName = belt.charAt(0).toUpperCase() + belt.slice(1)
  const color = BELT_COLORS[belt]

  return (
    <Card className="overflow-hidden">
      {/* Belt header */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-5 h-5 rounded-full border-2 border-slate-600"
            style={{ backgroundColor: color }}
          />
          <h3 className="text-text-primary font-semibold">{beltName} Belt</h3>
        </div>
        {!editing && (
          <button
            onClick={() => {
              reset({
                requiredClasses: track?.requiredClasses ?? 0,
                unlockCriteria: track?.unlockCriteria ?? '',
              })
              setEditing(true)
            }}
            className="text-text-muted hover:text-text-primary transition-colors"
            title="Edit requirements"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="px-5 py-4">
        {editing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Required classes attended"
              type="number"
              min="0"
              error={errors.requiredClasses?.message}
              {...register('requiredClasses')}
            />
            <Input
              label="Unlock criteria (optional — v1.5 auto-unlock)"
              placeholder="e.g. 3 stripes on white belt"
              {...register('unlockCriteria')}
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" isLoading={saving}>
                <CheckIcon className="h-4 w-4 mr-1" /> Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Required classes</span>
              <span className="text-text-primary font-medium">
                {track?.requiredClasses ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Required techniques</span>
              <span className="text-text-primary font-medium">
                {track?.requiredTechniqueIds?.length ?? 0} assigned
              </span>
            </div>
            {track?.unlockCriteria && (
              <div className="mt-2 text-text-muted text-xs italic">
                {track.unlockCriteria}
              </div>
            )}
            {!track && (
              <p className="text-text-muted text-xs">Not configured yet — click edit to set requirements.</p>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export default function BeltTracks() {
  const [tracks, setTracks] = useState<Record<string, BeltTrack>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const results = await Promise.allSettled(
          BELT_LEVELS.map((belt) =>
            apiClient.get<BeltTrack>(`/belt-tracks/${belt}`).then((r) => ({ belt, data: r.data })),
          ),
        )
        const map: Record<string, BeltTrack> = {}
        results.forEach((r) => {
          if (r.status === 'fulfilled') {
            map[r.value.belt] = r.value.data
          }
        })
        setTracks(map)
      } catch {
        setError('Failed to load belt tracks')
      } finally {
        setLoading(false)
      }
    }
    fetchTracks()
  }, [])

  const handleSave = async (belt: BeltLevel, data: TrackForm) => {
    const res = await apiClient.put<BeltTrack>(`/belt-tracks/${belt}`, {
      requiredClasses: data.requiredClasses,
      unlockCriteria: data.unlockCriteria || null,
    })
    setTracks((prev) => ({ ...prev, [belt]: res.data }))
  }

  if (loading) return <LoadingSpinner className="mt-20" />
  if (error) return (
    <div className="text-center py-20 text-text-muted">
      <p>{error}</p>
      <Button onClick={() => window.location.reload()} className="mt-4" variant="ghost">Retry</Button>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-text-primary text-2xl font-bold">Belt Track Configuration</h1>
        <p className="text-text-muted text-sm mt-1">
          Set the number of required classes and assigned techniques for each belt level.
          Belt promotions remain manual — these thresholds guide students on their progress.
        </p>
      </div>

      <div className="space-y-4">
        {BELT_LEVELS.map((belt) => (
          <TrackEditor
            key={belt}
            belt={belt}
            track={tracks[belt] ?? null}
            onSave={handleSave}
          />
        ))}
      </div>

      <p className="text-text-muted text-xs mt-6 text-center">
        Auto-unlock based on criteria is planned for v1.5.
      </p>
    </div>
  )
}
