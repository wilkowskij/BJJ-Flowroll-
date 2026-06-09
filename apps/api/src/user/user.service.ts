import { Injectable, NotFoundException } from '@nestjs/common'
import { BeltLevel } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationService } from '../notification/notification.service'
import { RedisService } from '../redis/redis.service'
import { UpdateBeltDto } from './dto/update-belt.dto'
import { NotificationPreferencesDto } from './dto/notification-preferences.dto'

export interface StudentEngagementRow {
  id: string
  name: string
  email: string
  beltLevel: string
  techniqueCount: number
  attendanceCount: number
  lastActive: string | null
  churnRisk: 'low' | 'medium' | 'high'
}

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly redis: RedisService,
  ) {}

  async findBySupabaseUid(supabaseUid: string, gymId: string) {
    const user = await this.prisma.user.findFirst({
      where: { supabaseUid, gymId, deletedAt: null },
      include: {
        gym: { select: { name: true, primaryColor: true, secondaryColor: true, logoUrl: true } },
      },
    })
    if (!user) throw new NotFoundException(`User not found`)
    return user
  }

  async findAll(gymId: string) {
    return this.prisma.user.findMany({
      where: { gymId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string, gymId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, gymId, deletedAt: null },
    })
    if (!user) throw new NotFoundException(`User ${id} not found`)
    return user
  }

  async updateFcmToken(supabaseUid: string, gymId: string, token: string) {
    await this.prisma.user.updateMany({
      where: { supabaseUid, gymId },
      data: { firebaseToken: token },
    })
    return { updated: true }
  }

  async promoteBelt(id: string, gymId: string, dto: UpdateBeltDto) {
    const user = await this.findOne(id, gymId)

    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { beltLevel: dto.beltLevel },
      }),
      this.prisma.beltPromotion.create({
        data: {
          userId: id,
          promotedBy: dto.promotedBy,
          fromBelt: user.beltLevel,
          toBelt: dto.beltLevel,
        },
      }),
    ])

    // Fire-and-forget push notification to promoted student
    if (user.firebaseToken) {
      const beltName = dto.beltLevel.charAt(0).toUpperCase() + dto.beltLevel.slice(1)
      this.notifications
        .sendPushNotification(
          user.firebaseToken,
          '🥋 Belt Promotion!',
          `Congratulations! You've been promoted to ${beltName} belt.`,
          { type: 'belt_promotion', toBelt: dto.beltLevel },
        )
        .catch(() => {
          /* best-effort */
        })
    }

    return updatedUser
  }

  async getProgressSummary(
    supabaseUid: string,
    gymId: string,
  ): Promise<{
    techniqueCount: number
    attendanceCount: number
    lastActive: Date | null
    streak: number
    beltLevel: string
    progressPercent: number
  }> {
    const user = await this.prisma.user.findFirst({
      where: { supabaseUid, gymId, deletedAt: null },
    })
    if (!user) throw new NotFoundException(`User not found`)

    // Count distinct logged techniques
    const techniqueLogRows = await this.prisma.techniqueLog.findMany({
      where: { userId: user.id, gymId },
      select: { techniqueId: true },
      distinct: ['techniqueId'],
    })
    const techniqueCount = techniqueLogRows.length

    // Count attendance records
    const attendanceCount = await this.prisma.attendance.count({
      where: { userId: user.id, gymId },
    })

    // Last active: most recent attendance check-in
    const lastAttendance = await this.prisma.attendance.findFirst({
      where: { userId: user.id, gymId },
      orderBy: { checkedInAt: 'desc' },
      select: { checkedInAt: true },
    })
    const lastActive = lastAttendance?.checkedInAt ?? null

    // Streak: consecutive ISO weeks (ending now) with at least 1 attendance
    const allAttendance = await this.prisma.attendance.findMany({
      where: { userId: user.id, gymId },
      select: { checkedInAt: true },
      orderBy: { checkedInAt: 'desc' },
    })

    const streak = this.calculateWeeklyStreak(allAttendance.map((a) => a.checkedInAt))

    // Belt level
    const beltLevel = user.beltLevel

    // Progress percent from belt-track
    const beltOrder: BeltLevel[] = ['white', 'blue', 'purple', 'brown', 'black']
    const currentIdx = beltOrder.indexOf(user.beltLevel)
    const nextBelt: BeltLevel = beltOrder[currentIdx + 1] ?? 'black'

    const track = await this.prisma.beltTrack.findUnique({
      where: { gymId_beltLevel: { gymId, beltLevel: nextBelt } },
    })

    let progressPercent = 0
    if (track) {
      const requiredTechIds = (track.requiredTechniqueIds as string[]) ?? []
      const requiredClasses = track.requiredClasses ?? 0

      const loggedTechIds = techniqueLogRows
        .map((l) => l.techniqueId)
        .filter((id): id is string => id !== null)

      const techProgress =
        requiredTechIds.length > 0
          ? loggedTechIds.filter((id) => requiredTechIds.includes(id)).length /
            requiredTechIds.length
          : 1

      const classProgress = requiredClasses > 0 ? Math.min(attendanceCount / requiredClasses, 1) : 1

      progressPercent = Math.round(((techProgress + classProgress) / 2) * 100)
    } else if (user.beltLevel === 'black') {
      progressPercent = 100
    }

    return {
      techniqueCount,
      attendanceCount,
      lastActive,
      streak,
      beltLevel,
      progressPercent,
    }
  }

  async getStudentEngagement(gymId: string): Promise<StudentEngagementRow[]> {
    const cacheKey = this.redis.gymKey(gymId, 'student_engagement')
    return this.redis.getOrSet(cacheKey, 300, () => this.computeStudentEngagement(gymId))
  }

  private async computeStudentEngagement(gymId: string): Promise<StudentEngagementRow[]> {
    const students = await this.prisma.user.findMany({
      where: { gymId, isActive: true, deletedAt: null },
      include: {
        _count: {
          select: {
            techniqueLogs: true,
            attendance: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Fetch the most recent activity date per user in a single query each
    const now = new Date()

    const rows: StudentEngagementRow[] = await Promise.all(
      students.map(async (student) => {
        const [lastLog, lastAttendance] = await Promise.all([
          this.prisma.techniqueLog.findFirst({
            where: { userId: student.id, gymId },
            orderBy: { loggedAt: 'desc' },
            select: { loggedAt: true },
          }),
          this.prisma.attendance.findFirst({
            where: { userId: student.id, gymId },
            orderBy: { checkedInAt: 'desc' },
            select: { checkedInAt: true },
          }),
        ])

        const dates: Date[] = []
        if (lastLog) dates.push(lastLog.loggedAt)
        if (lastAttendance) dates.push(lastAttendance.checkedInAt)

        const lastActiveDate =
          dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null

        let churnRisk: 'low' | 'medium' | 'high'
        if (!lastActiveDate) {
          churnRisk = 'high'
        } else {
          const daysSinceActive = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
          if (daysSinceActive > 30) {
            churnRisk = 'high'
          } else if (daysSinceActive > 14) {
            churnRisk = 'medium'
          } else {
            churnRisk = 'low'
          }
        }

        return {
          id: student.id,
          name: student.name,
          email: student.email,
          beltLevel: student.beltLevel,
          techniqueCount: student._count.techniqueLogs,
          attendanceCount: student._count.attendance,
          lastActive: lastActiveDate ? lastActiveDate.toISOString() : null,
          churnRisk,
        }
      }),
    )

    return rows
  }

  async updateNotificationPreferences(supabaseUid: string, dto: NotificationPreferencesDto) {
    const user = await this.prisma.user.findFirst({
      where: { supabaseUid, deletedAt: null },
    })
    if (!user) throw new NotFoundException('User not found')

    const existing = (user.notificationPrefs as Record<string, boolean>) ?? {}
    const merged = { ...existing, ...dto }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { notificationPrefs: merged },
    })

    return { notificationPrefs: merged }
  }

  private calculateWeeklyStreak(dates: Date[]): number {
    if (dates.length === 0) return 0

    // Get unique ISO week keys (YYYY-WW)
    const weekSet = new Set<string>()
    for (const date of dates) {
      weekSet.add(this.getISOWeekKey(date))
    }

    const now = new Date()
    let streak = 0
    let currentWeek = this.getISOWeekKey(now)

    while (weekSet.has(currentWeek)) {
      streak++
      currentWeek = this.getPreviousWeekKey(currentWeek)
    }

    return streak
  }

  private getISOWeekKey(date: Date): string {
    const d = new Date(date)
    d.setUTCHours(0, 0, 0, 0)
    // Thursday in current week decides the year
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
    return `${d.getUTCFullYear()}-${String(weekNo).padStart(2, '0')}`
  }

  private getPreviousWeekKey(weekKey: string): string {
    const [yearStr, weekStr] = weekKey.split('-')
    let year = parseInt(yearStr, 10)
    let week = parseInt(weekStr, 10)

    week--
    if (week === 0) {
      year--
      // Weeks in previous year (52 or 53)
      week = this.weeksInYear(year)
    }

    return `${year}-${String(week).padStart(2, '0')}`
  }

  private weeksInYear(year: number): number {
    const dec28 = new Date(Date.UTC(year, 11, 28))
    return parseInt(this.getISOWeekKey(dec28).split('-')[1], 10)
  }
}
