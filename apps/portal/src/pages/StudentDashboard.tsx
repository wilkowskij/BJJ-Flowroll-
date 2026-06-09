import React, { useMemo, useState } from 'react'
import { UsersIcon, BoltIcon, BookOpenIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { mockStudents } from '@/api/mockData'
import type { Student } from '@/api/users'
import { StatCard } from '@/components/ui/StatCard'
import { BeltBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'

type SortKey = 'name' | 'techniquesLogged' | 'lastActiveAt' | 'flowchartNodes'
type SortDir = 'asc' | 'desc'

function getRiskLevel(lastActiveAt: string): 'green' | 'yellow' | 'red' {
  const daysSince = (Date.now() - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSince <= 7) return 'green'
  if (daysSince <= 21) return 'yellow'
  return 'red'
}

function RiskDot({ level }: { level: 'green' | 'yellow' | 'red' }) {
  const colors = {
    green: 'bg-success',
    yellow: 'bg-warning',
    red: 'bg-error',
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className={clsx('w-2.5 h-2.5 rounded-full', colors[level])} />
    </div>
  )
}

function formatRelativeDate(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

export default function StudentDashboard() {
  const [sortKey, setSortKey] = useState<SortKey>('lastActiveAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const students = mockStudents

  const atRiskCount = useMemo(
    () => students.filter((s) => getRiskLevel(s.lastActiveAt) === 'red').length,
    [students],
  )

  const avgTechniques = useMemo(() => {
    if (students.length === 0) return 0
    return Math.round(students.reduce((sum, s) => sum + s.techniquesLogged, 0) / students.length)
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
      else if (sortKey === 'techniquesLogged') cmp = a.techniquesLogged - b.techniquesLogged
      else if (sortKey === 'lastActiveAt')
        cmp = new Date(a.lastActiveAt).getTime() - new Date(b.lastActiveAt).getTime()
      else if (sortKey === 'flowchartNodes') cmp = a.flowchartNodes - b.flowchartNodes
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
      <PageHeader
        title="Students"
        subtitle="Track progress and manage your roster"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total Students"
          value={students.length}
          subtitle="Total enrolled"
          icon={UsersIcon}
          color="blue"
        />
        <StatCard
          label="Active This Week"
          value={Math.round(students.length * 0.8)}
          subtitle="Engaged in the last 7 days"
          icon={BoltIcon}
          color="emerald"
        />
        <StatCard
          label="Avg Techniques Logged"
          value={7.3}
          subtitle="Per student this month"
          icon={BookOpenIcon}
          color="purple"
        />
      </div>

      {/* Table */}
      {students.length === 0 ? (
        <EmptyState
          title="No students yet"
          description="Students will appear here once they join your gym."
          icon={<UsersIcon className="h-16 w-16" />}
        />
      ) : (
        <div className="bg-surface-elevated rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th
                    className="text-left px-4 py-3 text-text-secondary text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort('name')}
                  >
                    Student <SortIcon col="name" />
                  </th>
                  <th className="text-left px-4 py-3 text-text-secondary text-xs font-medium uppercase tracking-wider">
                    Belt
                  </th>
                  <th
                    className="text-left px-4 py-3 text-text-secondary text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort('techniquesLogged')}
                  >
                    Techniques <SortIcon col="techniquesLogged" />
                  </th>
                  <th
                    className="text-left px-4 py-3 text-text-secondary text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort('lastActiveAt')}
                  >
                    Last Active <SortIcon col="lastActiveAt" />
                  </th>
                  <th
                    className="text-left px-4 py-3 text-text-secondary text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort('flowchartNodes')}
                  >
                    Nodes <SortIcon col="flowchartNodes" />
                  </th>
                  <th className="text-left px-4 py-3 text-text-secondary text-xs font-medium uppercase tracking-wider">
                    Risk
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((student: Student) => {
                  const risk = getRiskLevel(student.lastActiveAt)
                  return (
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
                        <BeltBadge belt={student.belt} />
                      </td>
                      <td className="px-4 py-3 text-text-primary text-sm">
                        {student.techniquesLogged}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-sm">
                        {formatRelativeDate(student.lastActiveAt)}
                      </td>
                      <td className="px-4 py-3 text-text-primary text-sm">
                        {student.flowchartNodes}
                      </td>
                      <td className="px-4 py-3">
                        <RiskDot level={risk} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
