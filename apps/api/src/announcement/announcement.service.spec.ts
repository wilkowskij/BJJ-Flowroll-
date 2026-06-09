import { Test, TestingModule } from '@nestjs/testing'
import { AnnouncementService } from './announcement.service'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationService } from '../notification/notification.service'

describe('AnnouncementService', () => {
  let service: AnnouncementService
  let prisma: {
    announcement: {
      create: jest.Mock
      findMany: jest.Mock
      deleteMany: jest.Mock
    }
    user: {
      findMany: jest.Mock
    }
  }
  let notifications: {
    sendMulticastNotification: jest.Mock
    sendPushNotification: jest.Mock
  }

  beforeEach(async () => {
    prisma = {
      announcement: {
        create: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
      },
    }

    notifications = {
      sendMulticastNotification: jest.fn().mockResolvedValue(undefined),
      sendPushNotification: jest.fn().mockResolvedValue(undefined),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notifications },
      ],
    }).compile()

    service = module.get<AnnouncementService>(AnnouncementService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create()', () => {
    const gymId = 'gym-1'
    const instructorId = 'instructor-1'
    const dto = { title: 'Belt Test Saturday', body: 'All students are invited.' }

    it('saves the announcement with the correct gymId and instructorId', async () => {
      const created = { id: 'ann-1', gymId, instructorId, ...dto }
      prisma.announcement.create.mockResolvedValue(created)
      prisma.user.findMany.mockResolvedValue([])

      const result = await service.create(gymId, instructorId, dto)

      expect(result).toEqual(created)
      expect(prisma.announcement.create).toHaveBeenCalledWith({
        data: { gymId, instructorId, title: dto.title, body: dto.body },
      })
    })

    it('returns the created announcement immediately (not waiting for notifications)', async () => {
      const created = { id: 'ann-2', gymId, instructorId, ...dto }
      prisma.announcement.create.mockResolvedValue(created)
      // Simulate slow user query (never resolves during this test)
      prisma.user.findMany.mockReturnValue(new Promise(() => {}))

      const result = await service.create(gymId, instructorId, dto)

      expect(result).toEqual(created)
    })

    it('triggers sendMulticastNotification when active users have FCM tokens', async () => {
      const created = { id: 'ann-3', gymId, instructorId, ...dto }
      prisma.announcement.create.mockResolvedValue(created)
      prisma.user.findMany.mockResolvedValue([
        { firebaseToken: 'token-a' },
        { firebaseToken: 'token-b' },
      ])

      await service.create(gymId, instructorId, dto)

      // Wait for the fire-and-forget chain to complete
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(notifications.sendMulticastNotification).toHaveBeenCalledWith(
        ['token-a', 'token-b'],
        dto.title,
        dto.body,
        expect.objectContaining({ type: 'announcement', announcementId: 'ann-3' }),
      )
    })

    it('does NOT call sendMulticastNotification when no users have FCM tokens', async () => {
      const created = { id: 'ann-4', gymId, instructorId, ...dto }
      prisma.announcement.create.mockResolvedValue(created)
      prisma.user.findMany.mockResolvedValue([])

      await service.create(gymId, instructorId, dto)

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(notifications.sendMulticastNotification).not.toHaveBeenCalled()
    })

    it('queries only active users in the correct gym for notifications', async () => {
      const created = { id: 'ann-5', gymId, instructorId, ...dto }
      prisma.announcement.create.mockResolvedValue(created)
      prisma.user.findMany.mockResolvedValue([])

      await service.create(gymId, instructorId, dto)

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            gymId,
            isActive: true,
          }),
        }),
      )
    })
  })

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('returns only announcements for the requesting gym', async () => {
      const gymId = 'gym-1'
      const announcements = [
        { id: 'ann-1', gymId, title: 'First', body: 'Body 1' },
        { id: 'ann-2', gymId, title: 'Second', body: 'Body 2' },
      ]
      prisma.announcement.findMany.mockResolvedValue(announcements)

      const result = await service.findAll(gymId)

      expect(result).toEqual(announcements)
      expect(prisma.announcement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ gymId }),
        }),
      )
    })

    it('does not return announcements from another gym', async () => {
      const gymId = 'gym-correct'
      const otherGymId = 'gym-other'

      prisma.announcement.findMany.mockImplementation(
        ({ where }: { where?: { gymId?: string } }) => {
          if (where?.gymId === gymId) {
            return Promise.resolve([{ id: 'ann-1', gymId }])
          }
          return Promise.resolve([])
        },
      )

      const resultCorrect = await service.findAll(gymId)
      const resultOther = await service.findAll(otherGymId)

      expect(resultCorrect).toHaveLength(1)
      expect(resultOther).toHaveLength(0)
    })

    it('returns an empty array when no announcements exist for the gym', async () => {
      prisma.announcement.findMany.mockResolvedValue([])

      const result = await service.findAll('gym-empty')

      expect(result).toEqual([])
    })

    it('limits results to 50 announcements', async () => {
      prisma.announcement.findMany.mockResolvedValue([])

      await service.findAll('gym-1')

      expect(prisma.announcement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      )
    })
  })

  // ─── remove ──────────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('deletes only the announcement matching both id and gymId', async () => {
      prisma.announcement.deleteMany.mockResolvedValue({ count: 1 })

      const result = await service.remove('ann-1', 'gym-1')

      expect(result).toEqual({ count: 1 })
      expect(prisma.announcement.deleteMany).toHaveBeenCalledWith({
        where: { id: 'ann-1', gymId: 'gym-1' },
      })
    })

    it('does not delete an announcement from a different gym', async () => {
      // deleteMany with the wrong gymId will affect 0 records
      prisma.announcement.deleteMany.mockResolvedValue({ count: 0 })

      const result = await service.remove('ann-1', 'gym-wrong')

      expect(prisma.announcement.deleteMany).toHaveBeenCalledWith({
        where: { id: 'ann-1', gymId: 'gym-wrong' },
      })
      expect(result).toEqual({ count: 0 })
    })
  })
})
