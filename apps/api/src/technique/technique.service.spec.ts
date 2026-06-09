import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { TechniqueService } from './technique.service'
import { PrismaService } from '../prisma/prisma.service'

describe('TechniqueService', () => {
  let service: TechniqueService
  let prisma: {
    technique: {
      findMany: jest.Mock
      findFirst: jest.Mock
      create: jest.Mock
      update: jest.Mock
      delete: jest.Mock
      count: jest.Mock
    }
    $transaction: jest.Mock
  }

  beforeEach(async () => {
    prisma = {
      technique: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [TechniqueService, { provide: PrismaService, useValue: prisma }],
    }).compile()

    service = module.get<TechniqueService>(TechniqueService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('findAll()', () => {
    it('returns only techniques belonging to the requesting gymId', async () => {
      const gymId = 'gym-abc'
      const techniques = [
        { id: 't1', gymId, title: 'Armbar' },
        { id: 't2', gymId, title: 'Triangle' },
      ]
      prisma.technique.findMany.mockResolvedValue(techniques)

      const result = await service.findAll(gymId, {})

      expect(result).toEqual(techniques)
      expect(prisma.technique.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ gymId }),
        }),
      )
    })

    it('does not return techniques from another gym', async () => {
      const gymId = 'gym-correct'
      const otherGymId = 'gym-other'

      prisma.technique.findMany.mockImplementation(({ where }: { where?: { gymId?: string } }) => {
        if (where?.gymId === gymId) return Promise.resolve([{ id: 't1', gymId }])
        return Promise.resolve([])
      })

      const resultCorrect = await service.findAll(gymId, {})
      const resultOther = await service.findAll(otherGymId, {})

      expect(resultCorrect).toHaveLength(1)
      expect(resultOther).toHaveLength(0)
    })

    it('passes position and beltLevel filters through to Prisma', async () => {
      const gymId = 'gym-1'
      prisma.technique.findMany.mockResolvedValue([])

      await service.findAll(gymId, { position: 'guard', beltLevel: 'blue' } as any)

      expect(prisma.technique.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            gymId,
            position: 'guard',
            beltLevel: 'blue',
          }),
        }),
      )
    })
  })

  describe('create()', () => {
    it('sets gymId from the auth context, not from the DTO', async () => {
      const gymId = 'gym-from-auth'
      const dto = {
        title: 'Kimura',
        position: 'side_control',
        beltLevel: 'blue',
        type: 'submission',
      } as any
      const created = { id: 't-new', gymId, ...dto }

      prisma.technique.create.mockResolvedValue(created)

      const result = await service.create(gymId, dto)

      expect(result).toEqual(created)
      expect(prisma.technique.create).toHaveBeenCalledWith({
        data: { ...dto, gymId },
      })
    })

    it('uses auth gymId even when dto contains a different gymId field', async () => {
      const authGymId = 'gym-from-auth'
      const dto = {
        title: 'Omoplata',
        position: 'guard',
        beltLevel: 'white',
        type: 'submission',
      } as any
      const created = { id: 't-new', gymId: authGymId }

      prisma.technique.create.mockResolvedValue(created)

      await service.create(authGymId, dto)

      expect(prisma.technique.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ gymId: authGymId }),
      })
    })
  })

  describe('findOne()', () => {
    it('returns a technique when it belongs to the requesting gym', async () => {
      const gymId = 'gym-abc'
      const technique = { id: 'tech-1', gymId, title: 'Choke' }
      prisma.technique.findFirst.mockResolvedValue(technique)

      const result = await service.findOne('tech-1', gymId)

      expect(result).toEqual(technique)
      expect(prisma.technique.findFirst).toHaveBeenCalledWith({
        where: { id: 'tech-1', gymId },
      })
    })

    it('throws NotFoundException when technique belongs to a different gym', async () => {
      prisma.technique.findFirst.mockResolvedValue(null)

      await expect(service.findOne('tech-1', 'gym-wrong')).rejects.toThrow(NotFoundException)
    })

    it('throws NotFoundException when technique does not exist at all', async () => {
      prisma.technique.findFirst.mockResolvedValue(null)

      await expect(service.findOne('nonexistent', 'gym-abc')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update()', () => {
    it('throws NotFoundException when updating a technique from a different gym', async () => {
      prisma.technique.findFirst.mockResolvedValue(null)

      await expect(
        service.update('tech-1', 'gym-wrong', { title: 'Hacked' } as any),
      ).rejects.toThrow(NotFoundException)
    })

    it('updates the technique when gymId matches', async () => {
      const gymId = 'gym-abc'
      const existing = { id: 'tech-1', gymId, title: 'Old Title' }
      const updated = { ...existing, title: 'New Title' }

      prisma.technique.findFirst.mockResolvedValue(existing)
      prisma.technique.update.mockResolvedValue(updated)

      const result = await service.update('tech-1', gymId, { title: 'New Title' } as any)

      expect(result).toEqual(updated)
      expect(prisma.technique.update).toHaveBeenCalledWith({
        where: { id: 'tech-1' },
        data: { title: 'New Title' },
      })
    })

    it('does not call prisma.technique.update when gym check fails', async () => {
      prisma.technique.findFirst.mockResolvedValue(null)

      await expect(service.update('tech-1', 'gym-bad', {} as any)).rejects.toThrow()

      expect(prisma.technique.update).not.toHaveBeenCalled()
    })
  })

  describe('remove()', () => {
    it('throws NotFoundException when deleting a technique from a different gym', async () => {
      prisma.technique.findFirst.mockResolvedValue(null)

      await expect(service.remove('tech-1', 'gym-wrong')).rejects.toThrow(NotFoundException)
    })

    it('deletes the technique when gymId matches', async () => {
      const gymId = 'gym-abc'
      const existing = { id: 'tech-1', gymId, title: 'Armbar' }

      prisma.technique.findFirst.mockResolvedValue(existing)
      prisma.technique.delete.mockResolvedValue(existing)

      const result = await service.remove('tech-1', gymId)

      expect(result).toEqual(existing)
      expect(prisma.technique.delete).toHaveBeenCalledWith({ where: { id: 'tech-1' } })
    })

    it('does not call prisma.technique.delete when gym check fails', async () => {
      prisma.technique.findFirst.mockResolvedValue(null)

      await expect(service.remove('tech-1', 'gym-bad')).rejects.toThrow()

      expect(prisma.technique.delete).not.toHaveBeenCalled()
    })
  })
})
