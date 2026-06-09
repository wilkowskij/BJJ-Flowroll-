import React, { useEffect, useMemo, useState } from 'react'
import { UsersIcon, BoltIcon, BookOpenIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { usersApi } from '@/api/users'
import type { StudentEngagementRow } from '@/api/users'
import { StatCard } from '@/components/ui/StatCard'
import { BeltBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StudentRowSkeleton } from '@/components/ui/Skeleton'

type SortKey = 'name' | 'techniqueCount' | 'attendanceCount' | 'lastActive'
type SortDir = 'asc' | 'desc'

const CHURN_LABELS: Record<StudentEngagementRow['churnRisk'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

const CHURN_CLASSES: Record<StudentEngagementRow['churnRisk'], string> = {
  low: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  high: 'bg-red-500/15 text-red-400 border border-red-500/30',
}

function ChurnBadge({ risk }: { risk: StudentEngagementRow['churnRisk'] }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        CHURN_CLASSES[risk],
      )}
    >
      {CHURN_LABELS[risk]}
    </span>
  )
}

function formatRelativeDate(dateStr: string | null) {
  if (!dateStr) return 'Never'
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

export default function StudentDashboard() {
  const [students, setStudents] = useState<StudentEngagementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('lastActive')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    usersApi
      .listStudentEngagement()
      .then((res) => {
        if (!cancelled) {
          setStudents(res.data)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load students.'
          setError(message)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const atRiskCount = useMemo(
    () => students.filter((s) => s.churnRisk === 'high').length,
    [students],
  )

  const avgTechniques = useMemo(() => {
    if (students.length === 0) return 0
    return Math.round(students.reduce((sum, s) => sum + s.techniqueCount, 0) / students.length)
  }, [students])

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = useMemo(() => {
    return [...students].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortKey === 'techniqueCount') cmp = a.techniqueCount - b.techniqueCount
      else if (sortKey === 'attendanceCount') cmp = a.attendanceCount - b.attendanceCount
      else if (sortKey === 'lastActive') {
        const aTime = a.lastActive ? new Date(a.lastActive).getTime() : 0
        const bTime = b.lastActive ? new Date(b.lastActive).getTime() : 0
        cmp = aTime - bTime
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [students, sortKey, sortDir])

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="ml-1 text-text-muted">
      {sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  return (
    <div className="p-6">
      <PageHeader title="Students" subtitle="Track progress and manage your roster" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total Students"
          value={loading ? '—' : students.length}
          subtitle="Total enrolled"
          icon={UsersIcon}
          color="blue"
        />
        <StatCard
          label="At-Risk Students"
          value={loading ? '—' : atRiskCount}
          subtitle="High churn risk"
          icon={BoltIcon}
          color="emerald"
        />
        <StatCard
          label="Avg Techniques Logged"
          value={loading ? '—' : avgTechniques}
          subtitle="Per student"
          icon={BookOpenIcon}
          color="purple"
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="bg-surface-elevated rounded-xl border border-slate-700 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <StudentRowSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && students.length === 0 && (
        <EmptyState
          title="No students yet"
          description="Students will appear here once they join your gym."
          icon={<UsersIcon className="h-16 w-16" />}
        />
      )}

      {/* Table */}
      {!loading && students.length > 0 && (
        <div className="bg-surface-elevated rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th
                    className="text-left px-4 py-3 text-text-secondary text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort('name')}
                  >
                    Name <SortIcon col="name" />
                  </th>
                  <th className="text-left px-4 py-3 text-text-secondary text-xs font-medium uppercase tracking-wider">
                    Belt
                  </th>
                  <th
                    className="text-left px-4 py-3 text-text-secondary text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort('techniqueCount')}
                  >
                    Techniques Logged <SortIcon col="techniqueCount" />
                  </th>
                  <th
                    className="text-left px-4 py-3 text-text-secondary text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort('attendanceCount')}
                  >
                    Attendance <SortIcon col="attendanceCount" />
                  </th>
                  <th
                    className="text-left px-4 py-3 text-text-secondary text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort('lastActive')}
                  >
                    Last Active <SortIcon col="lastActive" />
                  </th>
                  <th className="text-left px-4 py-3 text-text-secondary text-xs font-medium uppercase tracking-wider">
                    Churn Risk
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((student: StudentEngagementRow) => (
                  <tr
                    key={student.id}
                    className="border-b border-slate-800 hover:bg-surface-card/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-semibold text-xs">
                            {student.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-text-primary text-sm font-medium">{student.name}</p>
                          <p className="text-text-muted text-xs">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <BeltBadge belt={student.beltLevel} />
                    </td>
                    <td className="px-4 py-3 text-text-primary text-sm">
                      {student.techniqueCount}
                    </td>
                    <td className="px-4 py-3 text-text-primary text-sm">
                      {student.attendanceCount}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-sm">
                      {formatRelativeDate(student.lastActive)}
                    </td>
                    <td className="px-4 py-3">
                      <ChurnBadge risk={student.churnRisk} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
