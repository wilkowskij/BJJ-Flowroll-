import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveFlowchartDto } from './dto/save-flowchart.dto';

@Injectable()
export class FlowchartService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyFlowchart(userId: string, gymId: string) {
    const flowchart = await this.prisma.flowchart.findUnique({
      where: { userId },
    });

    if (!flowchart) {
      return this.prisma.flowchart.create({
        data: { userId, gymId },
      });
    }

    return flowchart;
  }

  async saveMyFlowchart(userId: string, gymId: string, dto: SaveFlowchartDto) {
    return this.prisma.flowchart.upsert({
      where: { userId },
      update: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.nodes !== undefined && { nodes: dto.nodes }),
        ...(dto.edges !== undefined && { edges: dto.edges }),
      },
      create: {
        userId,
        gymId,
        title: dto.title ?? 'My Flowchart',
        nodes: dto.nodes ?? [],
        edges: dto.edges ?? [],
      },
    });
  }

  async getTemplates(gymId: string) {
    return this.prisma.flowchart.findMany({
      where: { gymId, isTemplate: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listTemplates(gymId: string) {
    return this.prisma.flowchart.findMany({
      where: {
        isTemplate: true,
        OR: [{ gymId: null }, { gymId }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cloneTemplate(templateId: string, userId: string, gymId: string) {
    const template = await this.prisma.flowchart.findFirst({
      where: {
        id: templateId,
        isTemplate: true,
        OR: [{ gymId: null }, { gymId }],
      },
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    return this.prisma.flowchart.create({
      data: {
        userId,
        gymId,
        title: template.title,
        nodes: template.nodes,
        edges: template.edges,
        isTemplate: false,
      },
    });
  }
}
