import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { FlowchartService } from './flowchart.service'
import { PrismaService } from '../prisma/prisma.service'

describe('FlowchartService', () => {
  let service: FlowchartService
  let prisma: {
    flowchart: {
      findUnique: jest.Mock
      findFirst: jest.Mock
      findMany: jest.Mock
      create: jest.Mock
      upsert: jest.Mock
    }
  }

  beforeEach(async () => {
    prisma = {
      flowchart: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
      },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [FlowchartService, { provide: PrismaService, useValue: prisma }],
    }).compile()

    service = module.get<FlowchartService>(FlowchartService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('saveMyFlowchart()', () => {
    it('upserts with the correct gymId and userId from context', async () => {
      const userId = 'user-1'
      const gymId = 'gym-abc'
      const dto = { title: 'My Flow', nodes: [], edges: [] }
      const upserted = { id: 'fc-1', userId, gymId, ...dto }

      prisma.flowchart.upsert.mockResolvedValue(upserted)

      const result = await service.saveMyFlowchart(userId, gymId, dto as any)

      expect(result).toEqual(upserted)
      expect(prisma.flowchart.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          create: expect.objectContaining({ userId, gymId }),
        }),
      )
    })

    it('uses userId as the unique key for upsert', async () => {
      const userId = 'user-42'
      const gymId = 'gym-xyz'
      const dto = { nodes: [{ id: 'n1' }], edges: [] }

      prisma.flowchart.upsert.mockResolvedValue({ id: 'fc-2', userId, gymId })

      await service.saveMyFlowchart(userId, gymId, dto as any)

      expect(prisma.flowchart.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId } }),
      )
    })

    it('defaults title to "My Flowchart" in the create branch when not provided', async () => {
      const userId = 'user-1'
      const gymId = 'gym-abc'

      prisma.flowchart.upsert.mockResolvedValue({
        id: 'fc-1',
        userId,
        gymId,
        title: 'My Flowchart',
      })

      await service.saveMyFlowchart(userId, gymId, {} as any)

      expect(prisma.flowchart.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ title: 'My Flowchart' }),
        }),
      )
    })
  })

  describe('getMyFlowchart()', () => {
    it('returns the existing flowchart for the user', async () => {
      const userId = 'user-1'
      const gymId = 'gym-abc'
      const flowchart = { id: 'fc-1', userId, gymId, title: 'My Flow' }

      prisma.flowchart.findUnique.mockResolvedValue(flowchart)

      const result = await service.getMyFlowchart(userId, gymId)

      expect(result).toEqual(flowchart)
      expect(prisma.flowchart.findUnique).toHaveBeenCalledWith({ where: { userId } })
    })

    it('creates and returns a new flowchart when none exists for the user', async () => {
      const userId = 'user-new'
      const gymId = 'gym-abc'
      const created = { id: 'fc-new', userId, gymId }

      prisma.flowchart.findUnique.mockResolvedValue(null)
      prisma.flowchart.create.mockResolvedValue(created)

      const result = await service.getMyFlowchart(userId, gymId)

      expect(result).toEqual(created)
      expect(prisma.flowchart.create).toHaveBeenCalledWith({
        data: { userId, gymId },
      })
    })
  })

  describe('listTemplates()', () => {
    it('returns only records where isTemplate is true', async () => {
      const gymId = 'gym-abc'
      const templates = [
        { id: 'tmpl-1', isTemplate: true, gymId: null },
        { id: 'tmpl-2', isTemplate: true, gymId },
      ]

      prisma.flowchart.findMany.mockResolvedValue(templates)

      const result = await service.listTemplates(gymId)

      expect(result).toEqual(templates)
      expect(prisma.flowchart.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isTemplate: true }),
        }),
      )
    })

    it('returns an empty array when no templates exist', async () => {
      prisma.flowchart.findMany.mockResolvedValue([])

      const result = await service.listTemplates('gym-abc')

      expect(result).toEqual([])
    })

    it('includes global templates (gymId: null) and gym-specific templates', async () => {
      const gymId = 'gym-abc'
      prisma.flowchart.findMany.mockResolvedValue([])

      await service.listTemplates(gymId)

      expect(prisma.flowchart.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isTemplate: true,
            OR: expect.arrayContaining([
              expect.objectContaining({ gymId: null }),
              expect.objectContaining({ gymId }),
            ]),
          }),
        }),
      )
    })
  })

  describe('cloneTemplate()', () => {
    it('creates a new flowchart owned by the calling user with their gymId', async () => {
      const templateId = 'tmpl-1'
      const userId = 'user-clone'
      const gymId = 'gym-cloner'

      const template = {
        id: templateId,
        isTemplate: true,
        gymId: null,
        title: 'Guard Template',
        nodes: [{ id: 'n1' }],
        edges: [],
      }
      const cloned = { id: 'fc-clone', userId, gymId, title: template.title, isTemplate: false }

      prisma.flowchart.findFirst.mockResolvedValue(template)
      prisma.flowchart.create.mockResolvedValue(cloned)

      const result = await service.cloneTemplate(templateId, userId, gymId)

      expect(result).toEqual(cloned)
      expect(prisma.flowchart.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          gymId,
          title: template.title,
          nodes: template.nodes,
          edges: template.edges,
          isTemplate: false,
        }),
      })
    })

    it("does not copy the template owner's gymId into the cloned flowchart", async () => {
      const templateId = 'tmpl-1'
      const callerUserId = 'user-caller'
      const callerGymId = 'gym-caller'
      const templateGymId = 'gym-template-owner'

      const template = {
        id: templateId,
        isTemplate: true,
        gymId: templateGymId,
        title: 'Leg Lock System',
        nodes: [],
        edges: [],
      }

      prisma.flowchart.findFirst.mockResolvedValue(template)
      prisma.flowchart.create.mockResolvedValue({
        id: 'fc-new',
        userId: callerUserId,
        gymId: callerGymId,
      })

      await service.cloneTemplate(templateId, callerUserId, callerGymId)

      expect(prisma.flowchart.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          gymId: callerGymId,
          userId: callerUserId,
        }),
      })

      const callData = prisma.flowchart.create.mock.calls[0][0].data
      expect(callData.gymId).not.toBe(templateGymId)
    })

    it('throws NotFoundException when template does not exist', async () => {
      prisma.flowchart.findFirst.mockResolvedValue(null)

      await expect(service.cloneTemplate('nonexistent', 'user-1', 'gym-1')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('sets isTemplate to false on the cloned flowchart', async () => {
      const template = {
        id: 'tmpl-1',
        isTemplate: true,
        gymId: null,
        title: 'Base Template',
        nodes: [],
        edges: [],
      }

      prisma.flowchart.findFirst.mockResolvedValue(template)
      prisma.flowchart.create.mockResolvedValue({ id: 'fc-clone', isTemplate: false })

      await service.cloneTemplate('tmpl-1', 'user-1', 'gym-1')

      expect(prisma.flowchart.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isTemplate: false }),
      })
    })
  })
})
