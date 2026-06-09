import React from 'react'
import clsx from 'clsx'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'rect' | 'circle'
}

export function Skeleton({ className, variant = 'rect' }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-slate-700/50',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        variant === 'rect' && 'rounded-lg',
        className,
      )}
    />
  )
}

export function TechniqueCardSkeleton() {
  return (
    <div className="bg-surface-card rounded-xl p-4 space-y-3 border border-slate-700/50">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-1/2 h-3" />
        </div>
        <Skeleton variant="circle" className="w-8 h-8" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-20" />
      </div>
    </div>
  )
}

export function StudentRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-700/30">
      <Skeleton variant="circle" className="w-9 h-9" />
      <div className="flex-1 space-y-1.5">
        <Skeleton variant="text" className="w-40" />
        <Skeleton variant="text" className="w-24 h-3" />
      </div>
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-12" />
    </div>
  )
}

export function PostCardSkeleton() {
  return (
    <div className="bg-surface-card rounded-xl p-4 space-y-3 border border-slate-700/50">
      <Skeleton variant="text" className="w-2/3 h-5" />
      <Skeleton variant="text" className="w-full h-3" />
      <Skeleton variant="text" className="w-4/5 h-3" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  )
}
