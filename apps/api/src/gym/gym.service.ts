import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateGymDto } from './dto/create-gym.dto'
import { UpdateGymDto } from './dto/update-gym.dto'

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
