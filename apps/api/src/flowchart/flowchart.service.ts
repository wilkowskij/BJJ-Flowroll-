import { Injectable } from '@nestjs/common';
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
}
