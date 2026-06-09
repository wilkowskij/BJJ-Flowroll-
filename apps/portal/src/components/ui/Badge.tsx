import React from 'react'
import clsx from 'clsx'
import type { Belt } from '@/store/authStore'
import type { Position } from '@/api/techniques'

interface BadgeProps {
  children: React.ReactNode
  className?: string
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        className,
      )}
    >
      {children}
    </span>
  )
}

const beltColors: Record<Belt, string> = {
  white: 'bg-slate-100 text-slate-900 border border-slate-300',
  blue: 'bg-belt-blue text-white',
  purple: 'bg-belt-purple text-white',
  brown: 'bg-belt-brown text-white',
  black: 'bg-belt-black text-white border border-slate-600',
}

interface BeltBadgeProps {
  belt: Belt
  className?: string
}

export function BeltBadge({ belt, className }: BeltBadgeProps) {
  return (
    <Badge className={clsx(beltColors[belt], className)}>
      {belt.charAt(0).toUpperCase() + belt.slice(1)}
    </Badge>
  )
}

const positionColors: Record<Position, string> = {
  guard: 'bg-blue-900 text-blue-300',
  mount: 'bg-orange-900 text-orange-300',
  back: 'bg-purple-900 text-purple-300',
  side_control: 'bg-green-900 text-green-300',
  standing: 'bg-yellow-900 text-yellow-300',
}

const positionLabels: Record<Position, string> = {
  guard: 'Guard',
  mount: 'Mount',
  back: 'Back',
  side_control: 'Side Control',
  standing: 'Standing',
}

interface PositionChipProps {
  position: Position
  className?: string
}

export function PositionChip({ position, className }: PositionChipProps) {
  return (
    <Badge className={clsx(positionColors[position], className)}>
      {positionLabels[position]}
    </Badge>
  )
}
