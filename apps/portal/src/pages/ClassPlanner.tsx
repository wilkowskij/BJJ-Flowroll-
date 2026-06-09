import React, { useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/solid'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { mockTechniques } from '@/api/mockData'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

const classSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  day: z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
})

type ClassFormData = z.infer<typeof classSchema>

interface ClassBlock {
  id: string
  title: string
  startTime: string
  endTime: string
  day: string
  techniqueIds: string[]
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => {
  const hour = i + 7
  return `${hour.toString().padStart(2, '0')}:00`
})

const INITIAL_CLASSES: ClassBlock[] = [
  {
    id: 'class-1',
    title: 'Fundamentals',
    startTime: '09:00',
    endTime: '10:00',
    day: 'Mon',
    techniqueIds: ['tech-1', 'tech-2'],
  },
  {
    id: 'class-2',
    title: 'Advanced Guard',
    startTime: '18:00',
    endTime: '19:30',
    day: 'Wed',
    techniqueIds: ['tech-3'],
  },
  {
    id: 'class-3',
    title: 'Open Mat',
    startTime: '10:00',
    endTime: '12:00',
    day: 'Sat',
    techniqueIds: [],
  },
]

function getClassesForSlot(classes: ClassBlock[], day: string, time: string) {
  return classes.filter(
    (c) => c.day === day && c.startTime <= time && c.endTime > time,
  )
}

export default function ClassPlanner() {
  const [classes, setClasses] = useState<ClassBlock[]>(INITIAL_CLASSES)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string } | null>(null)
  const [selectedTechniqueIds, setSelectedTechniqueIds] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
  })

  const openCreateModal = (day: string, time: string) => {
    setSelectedSlot({ day, time })
    setSelectedTechniqueIds([])
    reset({
      day: day as ClassFormData['day'],
      startTime: time,
      endTime: `${(parseInt(time) + 1).toString().padStart(2, '0')}:00`,
      title: '',
    })
    setIsModalOpen(true)
  }

  const toggleTechnique = (id: string) => {
    setSelectedTechniqueIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    )
  }

  const onSubmit = (data: ClassFormData) => {
    const newClass: ClassBlock = {
      id: `class-${Date.now()}`,
      ...data,
      techniqueIds: selectedTechniqueIds,
    }
    setClasses((prev) => [...prev, newClass])
    setIsModalOpen(false)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">Class Planner</h1>
          <p className="text-text-secondary text-sm mt-0.5">Weekly schedule</p>
        </div>
        <Button
          onClick={() => openCreateModal('Mon', '09:00')}
          leftIcon={<PlusIcon className="h-4 w-4" />}
        >
          Add Class
        </Button>
      </div>

      {/* Calendar */}
      <div className="bg-surface-elevated rounded-xl border border-slate-700 overflow-auto">
        {/* Header */}
        <div className="grid border-b border-slate-700" style={{ gridTemplateColumns: '70px repeat(7, 1fr)' }}>
          <div className="p-3 border-r border-slate-700" />
          {DAYS.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-text-secondary text-sm font-medium border-r border-slate-700 last:border-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Time slots */}
        {TIME_SLOTS.map((time) => (
          <div
            key={time}
            className="grid border-b border-slate-800 last:border-0"
            style={{ gridTemplateColumns: '70px repeat(7, 1fr)' }}
          >
            <div className="p-2 border-r border-slate-700 text-text-muted text-xs text-right pr-3 pt-3">
              {time}
            </div>
            {DAYS.map((day) => {
              const dayClasses = getClassesForSlot(classes, day, time)
              return (
                <div
                  key={day}
                  className="min-h-[52px] border-r border-slate-800 last:border-0 p-1 relative group"
                >
                  {dayClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="bg-primary/20 border border-primary/40 rounded text-xs p-1 mb-0.5 text-primary font-medium"
                    >
                      <div className="truncate">{cls.title}</div>
                      <div className="text-primary/70 text-[10px]">
                        {cls.startTime}–{cls.endTime}
                      </div>
                      {cls.techniqueIds.length > 0 && (
                        <div className="text-primary/60 text-[10px]">
                          {cls.techniqueIds.length} tech
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Add button on hover */}
                  <button
                    onClick={() => openCreateModal(day, time)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title={`Add class at ${time} on ${day}`}
                  >
                    <PlusIcon className="h-4 w-4 text-text-muted" />
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Class"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)}>Schedule</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Class Title"
            placeholder="e.g. Fundamentals, No-Gi, Open Mat"
            error={errors.title?.message}
            {...register('title')}
          />
          <Select label="Day" error={errors.day?.message} {...register('day')}>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              error={errors.startTime?.message}
              {...register('startTime')}
            />
            <Input
              label="End Time"
              type="time"
              error={errors.endTime?.message}
              {...register('endTime')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Techniques
            </label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {mockTechniques.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-card cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTechniqueIds.includes(t.id)}
                    onChange={() => toggleTechnique(t.id)}
                    className="rounded border-slate-600 text-primary bg-surface-elevated focus:ring-primary"
                  />
                  <span className="text-text-secondary text-sm">{t.title}</span>
                </label>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
