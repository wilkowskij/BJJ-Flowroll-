import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MegaphoneIcon, TrashIcon } from '@heroicons/react/24/outline'
import { apiClient } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

interface Announcement {
  id: string
  title: string
  body: string
  createdAt: string
}

const schema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  body: z.string().min(5, 'Message must be at least 5 characters'),
})

type FormData = z.infer<typeof schema>

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    apiClient.get<Announcement[]>('/announcements')
      .then((r) => setAnnouncements(r.data))
      .catch(() => setError('Failed to load announcements'))
      .finally(() => setLoading(false))
  }, [])

  const onSubmit = async (data: FormData) => {
    setSending(true)
    try {
      const res = await apiClient.post<Announcement>('/announcements', data)
      setAnnouncements((prev) => [res.data, ...prev])
      reset()
    } catch {
      setError('Failed to send announcement')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/announcements/${id}`)
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    } catch {
      setError('Failed to delete announcement')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-text-primary text-2xl font-bold">Announcements</h1>
        <p className="text-text-muted text-sm mt-1">
          Send a message to all students in your gym. Delivered via push notification.
        </p>
      </div>

      {/* Compose */}
      <Card className="p-5">
        <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
          <MegaphoneIcon className="h-5 w-5 text-primary" />
          New Announcement
        </h2>
        {error && (
          <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Subject"
            placeholder="e.g. No-gi Friday this week!"
            error={errors.title?.message}
            {...register('title')}
          />
          <Textarea
            label="Message"
            placeholder="Write your announcement here..."
            rows={4}
            error={errors.body?.message}
            {...register('body')}
          />
          <Button type="submit" isLoading={sending} className="w-full">
            Send to All Students
          </Button>
        </form>
      </Card>

      {/* History */}
      <div>
        <h2 className="text-text-primary font-semibold mb-3">Recent Announcements</h2>
        {loading ? (
          <LoadingSpinner className="mt-6" />
        ) : announcements.length === 0 ? (
          <EmptyState
            icon={MegaphoneIcon}
            title="No announcements yet"
            description="Send your first announcement to all students above."
          />
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="bg-surface-elevated rounded-xl border border-slate-700 px-4 py-3 flex gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-text-primary font-medium text-sm truncate">{a.title}</span>
                    <span className="text-text-muted text-xs flex-shrink-0">{timeAgo(a.createdAt)}</span>
                  </div>
                  <p className="text-text-secondary text-sm line-clamp-2">{a.body}</p>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-text-muted hover:text-error transition-colors flex-shrink-0 self-start mt-0.5"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
