import React, { useCallback, useRef, useState } from 'react'
import {
  ArrowUpTrayIcon,
  VideoCameraIcon,
  XMarkIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { apiClient } from '@/api/client'
import { Button } from './Button'

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500 MB

export interface VideoUploadProps {
  techniqueId?: string
  weeklyPostId?: string
  currentVideoUrl?: string
  onUploadComplete: (playbackUrl: string) => void
}

type UploadState =
  | { status: 'idle' }
  | { status: 'selected'; file: File }
  | { status: 'uploading'; file: File; progress: number; abort: () => void }
  | { status: 'processing' }
  | { status: 'complete'; playbackUrl: string }
  | { status: 'error'; message: string }

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function VideoUpload({
  techniqueId,
  weeklyPostId,
  currentVideoUrl,
  onUploadComplete,
}: VideoUploadProps) {
  const [state, setState] = useState<UploadState>(
    currentVideoUrl
      ? { status: 'complete', playbackUrl: currentVideoUrl }
      : { status: 'idle' },
  )
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateAndSelect = useCallback((file: File) => {
    if (!file.type.startsWith('video/')) {
      setState({ status: 'error', message: 'Please select a video file (MP4 or MOV).' })
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setState({
        status: 'error',
        message: 'File exceeds 500 MB limit. Please choose a smaller video.',
      })
      return
    }
    setState({ status: 'selected', file })
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) validateAndSelect(file)
      // Reset input so the same file can be re-selected
      e.target.value = ''
    },
    [validateAndSelect],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (file) validateAndSelect(file)
    },
    [validateAndSelect],
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const startUpload = useCallback(async () => {
    if (state.status !== 'selected') return
    const { file } = state

    try {
      // Step 1: get presigned URL
      const { data: presigned } = await apiClient.post<{ uploadUrl: string; s3Key: string }>(
        '/video/upload-url',
        { fileName: file.name, contentType: file.type },
      )

      // Step 2: upload to S3 via XHR (for real progress tracking)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        const abort = () => {
          xhr.abort()
          setState({ status: 'idle' })
        }

        setState({
          status: 'uploading',
          file,
          progress: 0,
          abort,
        })

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100)
            setState((prev) =>
              prev.status === 'uploading' ? { ...prev, progress: pct } : prev,
            )
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`S3 upload failed: ${xhr.status}`))
          }
        }

        xhr.onerror = () => reject(new Error('Network error during upload.'))

        xhr.open('PUT', presigned.uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.send(file)
      })

      // Step 3: trigger Mux processing
      setState({ status: 'processing' })
      if (techniqueId) {
        await apiClient.post(`/video/technique/${techniqueId}/process`, {
          s3Key: presigned.s3Key,
        })
      } else if (weeklyPostId) {
        await apiClient.post(`/video/weekly-post/${weeklyPostId}/process`, {
          s3Key: presigned.s3Key,
        })
      }

      // Step 4: wait ~30s then resolve with placeholder
      // (actual playbackUrl arrives via Mux webhook -> DB -> next page refresh)
      await new Promise<void>((resolve) => setTimeout(resolve, 30_000))

      const playbackUrl = `https://stream.mux.com/${presigned.s3Key}.m3u8`
      setState({ status: 'complete', playbackUrl })
      onUploadComplete(playbackUrl)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Upload failed. Please try again.'
      setState({ status: 'error', message })
    }
  }, [state, techniqueId, weeklyPostId, onUploadComplete])

  const reset = useCallback(() => {
    setState({ status: 'idle' })
  }, [])

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────

  if (state.status === 'complete') {
    return (
      <div className="space-y-3">
        <div className="bg-surface-elevated rounded-xl overflow-hidden border border-slate-700">
          <video
            src={state.playbackUrl}
            controls
            className="w-full max-h-60 object-contain bg-black"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-success text-sm font-medium">
            <CheckCircleIcon className="h-4 w-4" />
            Video ready
          </span>
          <Button variant="ghost" size="sm" onClick={reset}>
            Replace video
          </Button>
        </div>
      </div>
    )
  }

  if (state.status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8 rounded-xl border border-slate-700 bg-surface-elevated">
        <svg
          className="animate-spin h-8 w-8 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <div className="text-center">
          <p className="text-text-primary text-sm font-medium">Processing video…</p>
          <p className="text-text-muted text-xs mt-0.5">This may take a few minutes</p>
        </div>
      </div>
    )
  }

  if (state.status === 'uploading') {
    return (
      <div className="space-y-3 rounded-xl border border-slate-700 bg-surface-elevated p-4">
        <div className="flex items-center gap-3">
          <VideoCameraIcon className="h-5 w-5 text-text-muted flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{state.file.name}</p>
            <p className="text-xs text-text-muted">{formatBytes(state.file.size)}</p>
          </div>
        </div>
        <div className="space-y-1">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-200"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Uploading… {state.progress}%</span>
            <button
              onClick={state.abort}
              className="text-text-muted hover:text-error transition-colors flex items-center gap-1"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="rounded-xl border border-error/40 bg-error/10 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
          <p className="text-sm text-error">{state.message}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          leftIcon={<ArrowPathIcon className="h-4 w-4" />}
        >
          Try again
        </Button>
      </div>
    )
  }

  if (state.status === 'selected') {
    return (
      <div className="rounded-xl border border-slate-700 bg-surface-elevated p-4 space-y-3">
        <div className="flex items-center gap-3">
          <VideoCameraIcon className="h-5 w-5 text-text-muted flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{state.file.name}</p>
            <p className="text-xs text-text-muted">{formatBytes(state.file.size)}</p>
          </div>
          <button
            onClick={reset}
            className="text-text-muted hover:text-text-primary transition-colors p-1 rounded"
            aria-label="Remove file"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        <Button
          onClick={startUpload}
          leftIcon={<ArrowUpTrayIcon className="h-4 w-4" />}
          className="w-full justify-center"
        >
          Upload
        </Button>
      </div>
    )
  }

  // idle state
  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="sr-only"
        aria-label="Select video file"
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={clsx(
          'flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
          isDragOver
            ? 'border-primary bg-primary/10'
            : 'border-slate-600 hover:border-slate-500 bg-surface-elevated hover:bg-surface-card',
        )}
      >
        <ArrowUpTrayIcon
          className={clsx('h-8 w-8', isDragOver ? 'text-primary' : 'text-text-muted')}
        />
        <div className="text-center">
          <p className="text-text-secondary text-sm font-medium">
            Drag &amp; drop or click to select video
          </p>
          <p className="text-text-muted text-xs mt-1">Max 500MB · MP4 or MOV</p>
        </div>
      </div>
    </div>
  )
}
