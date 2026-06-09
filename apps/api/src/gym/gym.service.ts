import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateGymDto } from './dto/create-gym.dto'
import { UpdateGymDto } from './dto/update-gym.dto'

export interface TechniqueEngagement {
  techniqueId: string
  title: string
  position: string
  beltLevel: string
  logCount: number
  uniqueStudents: number
}

export interface InstructorAnalytics {
  topTechniques: TechniqueEngagement[]
  activeStudentsLast30Days: number
  avgTechniquesPerStudent: number
  totalTechniqueLogs: number
  positionBreakdown: Record<string, number>
}

export interface GymSummary {
  id: string
  name: string
  slug: string
  createdAt: Date
  activeStudentCount: number
  tier: string | null
}

export interface PlatformHealth {
  totalGyms: number
  totalStudents: number
  totalTechniques: number
  totalVideos: number
}

@Injectable()
export class GymService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGymDto) {
    return this.prisma.gym.create({ data: dto })
  }

  async findOne(id: string) {
    const gym = await this.prisma.gym.findUnique({ where: { id } })
    if (!gym) throw new NotFoundException(`Gym ${id} not found`)
    return gym
  }

  async update(id: string, dto: UpdateGymDto) {
    await this.findOne(id)
    return this.prisma.gym.update({ where: { id }, data: dto })
  }

  async listAllGyms(): Promise<GymSummary[]> {
    const gyms = await this.prisma.gym.findMany({
      include: {
        subscription: {
          select: { tier: true, activeStudentCount: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return gyms.map((gym) => ({
      id: gym.id,
      name: gym.name,
      slug: gym.slug,
      createdAt: gym.createdAt,
      activeStudentCount: gym.subscription?.activeStudentCount ?? 0,
      tier: gym.subscription?.tier ?? null,
    }))
  }

  async getInstructorAnalytics(gymId: string): Promise<InstructorAnalytics> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [allLogs, recentLogs, totalStudents] = await Promise.all([
      this.prisma.techniqueLog.findMany({
        where: { gymId, techniqueId: { not: null } },
        select: {
          techniqueId: true,
          userId: true,
          technique: { select: { title: true, position: true, beltLevel: true } },
        },
      }),
      this.prisma.techniqueLog.findMany({
        where: { gymId, loggedAt: { gte: thirtyDaysAgo } },
        select: { userId: true },
        distinct: ['userId'],
      }),
      this.prisma.user.count({ where: { gymId, isActive: true, deletedAt: null } }),
    ])

    // Aggregate per technique
    const byTechnique = new Map<
      string,
      { title: string; position: string; beltLevel: string; logCount: number; users: Set<string> }
    >()
    for (const log of allLogs) {
      if (!log.techniqueId || !log.technique) continue
      const entry = byTechnique.get(log.techniqueId) ?? {
        title: log.technique.title,
        position: log.technique.position,
        beltLevel: log.technique.beltLevel,
        logCount: 0,
        users: new Set(),
      }
      entry.logCount++
      entry.users.add(log.userId)
      byTechnique.set(log.techniqueId, entry)
    }

    const topTechniques: TechniqueEngagement[] = [...byTechnique.entries()]
      .sort((a, b) => b[1].logCount - a[1].logCount)
      .slice(0, 10)
      .map(([techniqueId, v]) => ({
        techniqueId,
        title: v.title,
        position: v.position,
        beltLevel: v.beltLevel,
        logCount: v.logCount,
        uniqueStudents: v.users.size,
      }))

    // Position breakdown
    const positionBreakdown: Record<string, number> = {}
    for (const log of allLogs) {
      if (!log.technique) continue
      const pos = log.technique.position
      positionBreakdown[pos] = (positionBreakdown[pos] ?? 0) + 1
    }

    const avgTechniquesPerStudent =
      totalStudents > 0 ? Math.round((allLogs.length / totalStudents) * 10) / 10 : 0

    return {
      topTechniques,
      activeStudentsLast30Days: recentLogs.length,
      avgTechniquesPerStudent,
      totalTechniqueLogs: allLogs.length,
      positionBreakdown,
    }
  }

  async getPlatformHealth(): Promise<PlatformHealth> {
    const [totalGyms, totalStudents, totalTechniques, totalVideos] = await Promise.all([
      this.prisma.gym.count(),
      this.prisma.user.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.technique.count(),
      this.prisma.technique.count({ where: { muxAssetId: { not: null } } }),
    ])

    return { totalGyms, totalStudents, totalTechniques, totalVideos }
  }
}
