import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UsersIcon,
  BookOpenIcon,
  CalendarIcon,
  CircleStackIcon,
  PlusCircleIcon,
  NewspaperIcon,
  QrCodeIcon,
  TrophyIcon,
  BellAlertIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'
import { apiClient } from '@/api/client'
import { useGymStore } from '@/store/gymStore'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardStats {
  activeStudents: number
  techniqueCount: number
  classesThisMonth: number
  storageUsedGb: number
  nextClassName: string | null
  nextClassTime: string | null
}

interface ActivityItem {
  id: string
  type: 'post' | 'announcement' | 'promotion' | 'technique'
  title: string
  description: string
  createdAt: string
}

interface UpcomingClass {
  id: string
  title: string
  instructorName: string
  scheduledAt: string
}

// ─── Mock / fallback data ─────────────────────────────────────────────────────

const MOCK_STATS: DashboardStats = {
  activeStudents: 47,
  techniqueCount: 124,
  classesThisMonth: 18,
  storageUsedGb: 2.4,
  nextClassName: 'Fundamentals',
  nextClassTime: 'Tomorrow at 6:30 PM',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateString: string): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(dateString).toLocaleDateString()
}

function activityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'post':
      return <DocumentTextIcon className="h-4 w-4 text-sky-400" />
    case 'announcement':
      return <BellAlertIcon className="h-4 w-4 text-amber-400" />
    case 'promotion':
      return <TrophyIcon className="h-4 w-4 text-emerald-400" />
    case 'technique':
      return <BookOpenIcon className="h-4 w-4 text-violet-400" />
    default:
      return <DocumentTextIcon className="h-4 w-4 text-slate-400" />
  }
}

function activityBg(type: ActivityItem['type']) {
  switch (type) {
    case 'post':
      return 'bg-sky-500/10'
    case 'announcement':
      return 'bg-amber-500/10'
    case 'promotion':
      return 'bg-emerald-500/10'
    case 'technique':
      return 'bg-violet-500/10'
    default:
      return 'bg-slate-500/10'
  }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  iconBg: string
  borderColor: string
}

function StatCard({ label, value, subtitle, icon, iconBg, borderColor }: StatCardProps) {
  return (
    <div
      className={`bg-[#263244] border ${borderColor} rounded-xl p-5 hover:border-slate-600 transition-colors flex flex-col gap-3 border-l-4`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wider">
          {label}
        </span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-[#F8FAFC] leading-none">{value}</p>
        <p className="text-[#94A3B8] text-sm mt-1">{subtitle}</p>
      </div>
    </div>
  )
}

// ─── Quick Action Tile ────────────────────────────────────────────────────────

interface QuickActionProps {
  label: string
  description: string
  icon: React.ReactNode
  iconBg: string
  onClick: () => void
}

function QuickActionTile({ label, description, icon, iconBg, onClick }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className="bg-[#1E293B] hover:bg-[#263244] border border-slate-700 hover:border-[#1B4FD8]/40 rounded-xl p-6 cursor-pointer transition-all group text-left w-full"
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${iconBg}`}
      >
        {icon}
      </div>
      <p className="text-[#F8FAFC] text-sm font-semibold leading-snug">{label}</p>
      <p className="text-[#94A3B8] text-xs mt-0.5">{description}</p>
    </button>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const { gymName, activeStudentCount } = useGymStore()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      // Fetch stats — fall back to mock on error
      const statsResult = await apiClient
        .get<DashboardStats>('/dashboard/stats')
        .then((r) => r.data)
        .catch(() => ({
          ...MOCK_STATS,
          activeStudents: activeStudentCount > 0 ? activeStudentCount : MOCK_STATS.activeStudents,
        }))

      // Fetch recent weekly posts for activity feed — fall back to []
      const postsResult = await apiClient
        .get<Array<{ id: string; title: string; status: string; createdAt: string; updatedAt: string }>>('/weekly-posts?limit=5')
        .then((r) => r.data)
        .catch(() => [])

      // Fetch upcoming classes — fall back to []
      const classesResult = await apiClient
        .get<UpcomingClass[]>('/classes/upcoming?limit=3')
        .then((r) => r.data)
        .catch(() => [])

      if (!cancelled) {
        setStats(statsResult)

        // Map posts to activity items
        const activityItems: ActivityItem[] = postsResult.map((p) => ({
          id: p.id,
          type: 'post' as const,
          title: p.title,
          description: p.status === 'published' ? 'Post published' : 'Post drafted',
          createdAt: p.updatedAt ?? p.createdAt,
        }))
        setActivity(activityItems)
        setUpcomingClasses(classesResult)
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [activeStudentCount])

  const s = stats ?? MOCK_STATS

  const storageLabel =
    s.storageUsedGb >= 1
      ? `${s.storageUsedGb.toFixed(1)} GB`
      : `${Math.round(s.storageUsedGb * 1024)} MB`

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto bg-[#0F172A] text-[#F8FAFC] p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#F8FAFC]">Dashboard</h1>
        <p className="text-[#94A3B8] text-sm mt-0.5">{gymName} — welcome back</p>
      </div>

      {/* ── Top row: stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Active Students"
          value={loading ? '—' : s.activeStudents}
          subtitle="↑ 3 this week"
          iconBg="bg-[#1B4FD8]/20"
          borderColor="border-[#1B4FD8]"
          icon={<UsersIcon className="h-5 w-5 text-[#1B4FD8]" />}
        />
        <StatCard
          label="Techniques"
          value={loading ? '—' : s.techniqueCount}
          subtitle="12 positions"
          iconBg="bg-emerald-500/20"
          borderColor="border-emerald-500"
          icon={<BookOpenIcon className="h-5 w-5 text-emerald-400" />}
        />
        <StatCard
          label="Classes / Month"
          value={loading ? '—' : s.classesThisMonth}
          subtitle={
            s.nextClassTime
              ? `Next: ${s.nextClassTime}`
              : 'No upcoming classes'
          }
          iconBg="bg-violet-500/20"
          borderColor="border-violet-500"
          icon={<CalendarIcon className="h-5 w-5 text-violet-400" />}
        />
        <StatCard
          label="Storage Used"
          value={loading ? '—' : storageLabel}
          subtitle="of 10 GB"
          iconBg="bg-amber-500/20"
          borderColor="border-amber-500"
          icon={<CircleStackIcon className="h-5 w-5 text-amber-400" />}
        />
      </div>

      {/* ── Middle row: activity + quick actions ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent Activity — 60% */}
        <div className="lg:col-span-3 bg-[#1E293B] border border-slate-700 rounded-xl p-5">
          <p className="text-[#94A3B8] text-xs font-bold uppercase tracking-wider mb-4">
            Recent Activity
          </p>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-700 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-700/60 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ArrowTrendingUpIcon className="h-10 w-10 text-slate-600 mb-3" />
              <p className="text-[#94A3B8] text-sm">No recent activity yet.</p>
              <p className="text-slate-600 text-xs mt-1">
                Create a post or add a technique to get started.
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {activity.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-[#263244] transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${activityBg(item.type)}`}
                  >
                    {activityIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#F8FAFC] text-sm font-medium truncate">{item.title}</p>
                    <p className="text-[#94A3B8] text-xs mt-0.5">{item.description}</p>
                  </div>
                  <span className="text-[#94A3B8] text-xs flex-shrink-0 mt-0.5">
                    {timeAgo(item.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick Actions — 40% */}
        <div className="lg:col-span-2 bg-[#1E293B] border border-slate-700 rounded-xl p-5">
          <p className="text-[#94A3B8] text-xs font-bold uppercase tracking-wider mb-4">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-3">
            <QuickActionTile
              label="Add Technique"
              description="Expand your library"
              iconBg="bg-[#1B4FD8]/20"
              icon={<PlusCircleIcon className="h-5 w-5 text-[#1B4FD8]" />}
              onClick={() => navigate('/library?new=1')}
            />
            <QuickActionTile
              label="Publish Post"
              description="Share with students"
              iconBg="bg-emerald-500/20"
              icon={<NewspaperIcon className="h-5 w-5 text-emerald-400" />}
              onClick={() => navigate('/posts')}
            />
            <QuickActionTile
              label="Show Class QR"
              description="Check-in students"
              iconBg="bg-violet-500/20"
              icon={<QrCodeIcon className="h-5 w-5 text-violet-400" />}
              onClick={() => navigate('/planner')}
            />
            <QuickActionTile
              label="Belt Promote"
              description="Promote a student"
              iconBg="bg-amber-500/20"
              icon={<TrophyIcon className="h-5 w-5 text-amber-400" />}
              onClick={() => navigate('/students')}
            />
          </div>
        </div>
      </div>

      {/* ── Bottom row: upcoming classes ─────────────────────────────────────── */}
      <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-5">
        <p className="text-[#94A3B8] text-xs font-bold uppercase tracking-wider mb-4">
          Upcoming Classes
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#263244] rounded-xl p-4 animate-pulse space-y-2">
                <div className="h-3 bg-slate-700 rounded w-1/2" />
                <div className="h-4 bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-700/60 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : upcomingClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CalendarIcon className="h-10 w-10 text-slate-600 mb-3" />
            <p className="text-[#94A3B8] text-sm">No upcoming classes scheduled.</p>
            <button
              onClick={() => navigate('/planner')}
              className="mt-3 text-xs text-[#1B4FD8] hover:text-blue-400 transition-colors font-medium"
            >
              Go to Class Planner →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {upcomingClasses.map((cls) => {
              const dt = new Date(cls.scheduledAt)
              const dateStr = dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
              const timeStr = dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
              return (
                <div
                  key={cls.id}
                  className="bg-[#263244] border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors"
                >
                  <p className="text-[#94A3B8] text-xs font-medium mb-1">
                    {dateStr} · {timeStr}
                  </p>
                  <p className="text-[#F8FAFC] text-sm font-semibold">{cls.title}</p>
                  <p className="text-[#94A3B8] text-xs mt-0.5">{cls.instructorName}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
