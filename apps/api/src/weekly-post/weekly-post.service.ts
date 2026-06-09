import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWeeklyPostDto } from './dto/create-weekly-post.dto';
import { UpdateWeeklyPostDto } from './dto/update-weekly-post.dto';

@Injectable()
export class WeeklyPostService {
  constructor(private readonly prisma: PrismaService) {}

  async create(gymId: string, instructorId: string, dto: CreateWeeklyPostDto) {
    return this.prisma.weeklyPost.create({
      data: {
        gymId,
        instructorId,
        title: dto.title,
        body: dto.body,
        videoUrl: dto.videoUrl,
        techniqueIds: dto.techniqueIds ?? [],
        beltTarget: dto.beltTarget,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
      },
    });
  }

  async findAll(gymId: string) {
    return this.prisma.weeklyPost.findMany({
      where: { gymId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, gymId: string) {
    const post = await this.prisma.weeklyPost.findFirst({
      where: { id, gymId },
    });
    if (!post) throw new NotFoundException(`WeeklyPost ${id} not found`);
    return post;
  }

  async update(id: string, gymId: string, dto: UpdateWeeklyPostDto) {
    await this.findOne(id, gymId);
    return this.prisma.weeklyPost.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.videoUrl !== undefined && { videoUrl: dto.videoUrl }),
        ...(dto.techniqueIds !== undefined && { techniqueIds: dto.techniqueIds }),
        ...(dto.beltTarget !== undefined && { beltTarget: dto.beltTarget }),
        ...(dto.scheduledFor !== undefined && { scheduledFor: new Date(dto.scheduledFor) }),
      },
    });
  }

  async remove(id: string, gymId: string) {
    await this.findOne(id, gymId);
    return this.prisma.weeklyPost.delete({ where: { id } });
  }

  async publish(id: string, gymId: string) {
    await this.findOne(id, gymId);
    return this.prisma.weeklyPost.update({
      where: { id },
      data: { publishedAt: new Date() },
    });
  }

  async getFeed(gymId: string) {
    return this.prisma.weeklyPost.findMany({
      where: { gymId, publishedAt: { not: null } },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    });
  }
}
