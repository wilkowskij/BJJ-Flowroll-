import React, { useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/solid'
import { CalendarIcon, BookOpenIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { mockPosts, mockTechniques } from '@/api/mockData'
import type { WeeklyPost } from '@/api/weeklyPosts'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { VideoUpload } from '@/components/ui/VideoUpload'

const postSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  body: z.string().min(10, 'Body must be at least 10 characters'),
  targetBelt: z.enum(['all', 'white', 'blue', 'purple', 'brown', 'black']),
  scheduledAt: z.string().optional(),
})

type PostFormData = z.infer<typeof postSchema>

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function WeeklyPosts() {
  const [posts, setPosts] = useState<WeeklyPost[]>(mockPosts)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<WeeklyPost | null>(null)
  const [selectedTechniqueIds, setSelectedTechniqueIds] = useState<string[]>([])
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: { targetBelt: 'all' },
  })

  const openCreate = () => {
    setEditingPost(null)
    setSelectedTechniqueIds([])
    setUploadedVideoUrl(null)
    reset({ targetBelt: 'all', title: '', body: '', scheduledAt: '' })
    setIsModalOpen(true)
  }

  const openEdit = (post: WeeklyPost) => {
    setEditingPost(post)
    setSelectedTechniqueIds(post.techniqueIds)
    setUploadedVideoUrl(null)
    reset({
      title: post.title,
      body: post.body,
      targetBelt: post.targetBelt,
      scheduledAt: post.scheduledAt?.slice(0, 10) ?? '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  const handlePublish = (id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: 'published' as const, publishedAt: new Date().toISOString() }
          : p,
      ),
    )
  }

  const toggleTechnique = (id: string) => {
    setSelectedTechniqueIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    )
  }

  const onSubmit = (data: PostFormData, publish = false) => {
    if (editingPost) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingPost.id
            ? {
                ...p,
                ...data,
                techniqueIds: selectedTechniqueIds,
                scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : null,
                updatedAt: new Date().toISOString(),
              }
            : p,
        ),
      )
    } else {
      const newPost: WeeklyPost = {
        id: `post-${Date.now()}`,
        gymId: 'gym-1',
        instructorId: 'user-1',
        title: data.title,
        body: data.body,
        status: publish ? 'published' : 'draft',
        techniqueIds: selectedTechniqueIds,
        targetBelt: data.targetBelt,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : null,
        publishedAt: publish ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setPosts((prev) => [newPost, ...prev])
    }
    setIsModalOpen(false)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">Weekly Posts</h1>
          <p className="text-text-secondary text-sm mt-0.5">{posts.length} posts</p>
        </div>
        <Button onClick={openCreate} leftIcon={<PlusIcon className="h-4 w-4" />}>
          New Post
        </Button>
      </div>

      {/* Posts feed */}
      {posts.length === 0 ? (
        <EmptyState
          title="No posts yet"
          description="Create your first weekly post to share techniques with your students."
          actionLabel="Create Post"
          onAction={openCreate}
        />
      ) : (
        <div className="max-w-2xl space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-surface-elevated border border-slate-700 rounded-xl p-5 hover:border-slate-500 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Avatar placeholder */}
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary font-semibold text-sm">CA</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-text-primary font-semibold text-base">{post.title}</h3>
                      {post.status === 'draft' && (
                        <Badge className="bg-slate-700 text-text-muted">Draft</Badge>
                      )}
                      {post.status === 'published' && (
                        <Badge className="bg-success/20 text-success">Published</Badge>
                      )}
                    </div>
                    <p className="text-text-secondary text-sm line-clamp-2 mb-3">{post.body}</p>
                    <div className="flex items-center gap-4 text-text-muted text-xs">
                      {post.publishedAt && (
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {formatDate(post.publishedAt)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <BookOpenIcon className="h-3.5 w-3.5" />
                        {post.techniqueIds.length} technique{post.techniqueIds.length !== 1 ? 's' : ''}
                      </span>
                      {post.targetBelt !== 'all' && (
                        <span className="capitalize">{post.targetBelt} belt</span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {post.status === 'draft' && (
                    <Button size="sm" variant="secondary" onClick={() => handlePublish(post.id)}>
                      Publish
                    </Button>
                  )}
                  <button
                    onClick={() => openEdit(post)}
                    className="p-1.5 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-surface-card"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-1.5 text-text-muted hover:text-error transition-colors rounded-lg hover:bg-error/10"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPost ? 'Edit Post' : 'New Post'}
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            {!editingPost && (
              <Button variant="ghost" onClick={handleSubmit((d) => onSubmit(d, false))}>
                Save Draft
              </Button>
            )}
            <Button onClick={handleSubmit((d) => onSubmit(d, !editingPost))}>
              {editingPost ? 'Save Changes' : 'Publish Now'}
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Post Title"
            placeholder="e.g. Week 3: Guard Retention"
            error={errors.title?.message}
            {...register('title')}
          />
          <Textarea
            label="Body"
            placeholder="What will students learn this week?..."
            rows={4}
            error={errors.body?.message}
            {...register('body')}
          />

          {/* Technique selector */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Techniques
            </label>
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {mockTechniques.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-card cursor-pointer"
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

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Target Belt"
              error={errors.targetBelt?.message}
              {...register('targetBelt')}
            >
              <option value="all">All Belts</option>
              <option value="white">White</option>
              <option value="blue">Blue</option>
              <option value="purple">Purple</option>
              <option value="brown">Brown</option>
              <option value="black">Black</option>
            </Select>
            <Input
              label="Scheduled Publish Date"
              type="date"
              error={errors.scheduledAt?.message}
              {...register('scheduledAt')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Video (optional)
            </label>
            <VideoUpload
              weeklyPostId={editingPost?.id}
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
