import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTechniqueDto } from './dto/create-technique.dto';
import { UpdateTechniqueDto } from './dto/update-technique.dto';
import { FilterTechniqueDto } from './dto/filter-technique.dto';
import { VideoLibraryFilterDto } from './dto/video-library-filter.dto';

@Injectable()
export class TechniqueService {
  constructor(private readonly prisma: PrismaService) {}

  async create(gymId: string, dto: CreateTechniqueDto) {
    return this.prisma.technique.create({
      data: { ...dto, gymId },
    });
  }

  async findAll(gymId: string, filters: FilterTechniqueDto) {
    return this.prisma.technique.findMany({
      where: {
        gymId,
        ...(filters.position && { position: filters.position }),
        ...(filters.beltLevel && { beltLevel: filters.beltLevel }),
        ...(filters.type && { type: filters.type }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTemplates() {
    return this.prisma.technique.findMany({
      where: { isTemplate: true, gymId: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, gymId: string) {
    const technique = await this.prisma.technique.findFirst({
      where: { id, gymId },
    });
    if (!technique) throw new NotFoundException(`Technique ${id} not found`);
    return technique;
  }

  async update(id: string, gymId: string, dto: UpdateTechniqueDto) {
    await this.findOne(id, gymId);
    return this.prisma.technique.update({ where: { id }, data: dto });
  }

  async remove(id: string, gymId: string) {
    await this.findOne(id, gymId);
    return this.prisma.technique.delete({ where: { id } });
  }

  async listVideos(
    gymId: string,
    filters: VideoLibraryFilterDto,
  ): Promise<{ items: any[]; total: number; page: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      gymId,
      muxPlaybackId: { not: null },
      ...(filters.position && { position: filters.position }),
      ...(filters.beltLevel && { beltLevel: filters.beltLevel }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.technique.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.technique.count({ where }),
    ]);

    return { items, total, page };
  }
}
