import React from 'react'
import clsx from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-surface-card rounded-xl border border-slate-700',
        onClick && 'cursor-pointer hover:border-slate-500 transition-colors',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  valueClassName?: string
}

export function StatCard({ title, value, subtitle, valueClassName }: StatCardProps) {
  return (
    <Card className="p-6">
      <p className="text-text-secondary text-sm font-medium">{title}</p>
      <p className={clsx('text-3xl font-bold text-text-primary mt-1', valueClassName)}>
        {value}
      </p>
      {subtitle && <p className="text-text-muted text-xs mt-1">{subtitle}</p>}
    </Card>
  )
}
