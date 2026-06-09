import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { UserService } from './user.service'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationService } from '../notification/notification.service'

// Prisma client may not be generated in CI; mock the exports it provides.
// PrismaClient must be a class because PrismaService extends it.
jest.mock('@prisma/client', () => ({
  PrismaClient: class PrismaClient {},
  BeltLevel: {
    white: 'white',
    blue: 'blue',
    purple: 'purple',
    brown: 'brown',
    black: 'black',
  },
}))

describe('UserService', () => {
  let service: UserService
  let prisma: {
    user: {
      findFirst: jest.Mock
      findMany: jest.Mock
      update: jest.Mock
      updateMany: jest.Mock
    }
    techniqueLog: {
      findMany: jest.Mock
    }
    attendance: {
      count: jest.Mock
      findFirst: jest.Mock
      findMany: jest.Mock
    }
    beltTrack: {
      findUnique: jest.Mock
    }
    beltPromotion: {
      create: jest.Mock
    }
    $transaction: jest.Mock
  }

  let notifications: {
    sendPushNotification: jest.Mock
    sendMulticastNotification: jest.Mock
  }

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      techniqueLog: {
        findMany: jest.fn(),
      },
      attendance: {
        count: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      beltTrack: {
        findUnique: jest.fn(),
      },
      beltPromotion: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    }

    notifications = {
      sendPushNotification: jest.fn().mockResolvedValue(undefined),
      sendMulticastNotification: jest.fn().mockResolvedValue(undefined),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notifications },
      ],
    }).compile()

    service = module.get<UserService>(UserService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // ─── getProgressSummary ─────────────────────────────────────────────────────

  describe('getProgressSummary()', () => {
    const supabaseUid = 'uid-1'
    const gymId = 'gym-1'
    const baseUser = {
      id: 'user-1',
      supabaseUid,
      gymId,
      beltLevel: 'blue' as const,
      deletedAt: null,
    }

    function setupProgressMocks({
      loggedTechIds = [] as string[],
      attendanceCount = 0,
      track = null as any,
    }) {
      prisma.user.findFirst.mockResolvedValue(baseUser)
      prisma.techniqueLog.findMany.mockResolvedValue(
        loggedTechIds.map((id) => ({ techniqueId: id })),
      )
      prisma.attendance.count.mockResolvedValue(attendanceCount)
      prisma.attendance.findFirst.mockResolvedValue(null)
      prisma.attendance.findMany.mockResolvedValue([])
      prisma.beltTrack.findUnique.mockResolvedValue(track)
    }

    it('throws NotFoundException when user is not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null)

      await expect(service.getProgressSummary('unknown', gymId)).rejects.toThrow(NotFoundException)
    })

    it('returns progressPercent = 100 when all techniques and classes are completed', async () => {
      const track = { requiredTechniqueIds: ['t1', 't2'], requiredClasses: 10 }
      setupProgressMocks({ loggedTechIds: ['t1', 't2'], attendanceCount: 10, track })

      const result = await service.getProgressSummary(supabaseUid, gymId)

      // techProgress = 1, classProgress = 1 → (1+1)/2 * 100 = 100
      expect(result.progressPercent).toBe(100)
    })

    it('returns progressPercent = 0 when no techniques logged and no classes attended', async () => {
      const track = { requiredTechniqueIds: ['t1', 't2'], requiredClasses: 10 }
      setupProgressMocks({ loggedTechIds: [], attendanceCount: 0, track })

      const result = await service.getProgressSummary(supabaseUid, gymId)

      // techProgress = 0, classProgress = 0 → 0
      expect(result.progressPercent).toBe(0)
    })

    it('correctly calculates progressPercent at 50% technique completion', async () => {
      const track = { requiredTechniqueIds: ['t1', 't2'], requiredClasses: 10 }
      setupProgressMocks({ loggedTechIds: ['t1'], attendanceCount: 5, track })

      const result = await service.getProgressSummary(supabaseUid, gymId)

      // techProgress = 0.5, classProgress = 0.5 → (0.5+0.5)/2 * 100 = 50
      expect(result.progressPercent).toBe(50)
    })

    it('returns progressPercent = 100 for a black belt (no track needed)', async () => {
      const blackBeltUser = { ...baseUser, beltLevel: 'black' as const }
      prisma.user.findFirst.mockResolvedValue(blackBeltUser)
      prisma.techniqueLog.findMany.mockResolvedValue([])
      prisma.attendance.count.mockResolvedValue(0)
      prisma.attendance.findFirst.mockResolvedValue(null)
      prisma.attendance.findMany.mockResolvedValue([])
      prisma.beltTrack.findUnique.mockResolvedValue(null)

      const result = await service.getProgressSummary(supabaseUid, gymId)

      expect(result.progressPercent).toBe(100)
    })

    it('returns progressPercent = 0 when no belt track is configured and user is not black belt', async () => {
      setupProgressMocks({ track: null })

      const result = await service.getProgressSummary(supabaseUid, gymId)

      expect(result.progressPercent).toBe(0)
    })

    it('counts only distinct techniqueIds logged by the user', async () => {
      const track = { requiredTechniqueIds: ['t1', 't2', 't3', 't4'], requiredClasses: 0 }
      setupProgressMocks({ loggedTechIds: ['t1', 't2'], attendanceCount: 0, track })

      const result = await service.getProgressSummary(supabaseUid, gymId)

      // techniqueCount == number of distinct logged techniques
      expect(result.techniqueCount).toBe(2)
    })

    it('returns beltLevel from the user record', async () => {
      setupProgressMocks({})

      const result = await service.getProgressSummary(supabaseUid, gymId)

      expect(result.beltLevel).toBe('blue')
    })

    it('caps classProgress at 1 even if attendance exceeds required classes', async () => {
      const track = { requiredTechniqueIds: [], requiredClasses: 10 }
      setupProgressMocks({ loggedTechIds: [], attendanceCount: 20, track })

      const result = await service.getProgressSummary(supabaseUid, gymId)

      // techProgress = 1 (no required), classProgress = min(2, 1) = 1 → 100
      expect(result.progressPercent).toBe(100)
    })
  })

  // ─── promoteBelt ────────────────────────────────────────────────────────────

  describe('promoteBelt()', () => {
    const gymId = 'gym-1'

    it('updates beltLevel to the specified belt', async () => {
      const user = { id: 'user-1', gymId, beltLevel: 'white', firebaseToken: null, deletedAt: null }
      const updated = { ...user, beltLevel: 'blue' }

      prisma.user.findFirst.mockResolvedValue(user)
      // $transaction returns array: [updatedUser, promotionRecord]
      prisma.$transaction.mockResolvedValue([updated, {}])

      const result = await service.promoteBelt('user-1', gymId, {
        beltLevel: 'blue' as any,
        promotedBy: 'instructor-1',
      })

      expect(result).toEqual(updated)
      expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    })

    it('records fromBelt and toBelt in beltPromotion', async () => {
      const user = { id: 'user-1', gymId, beltLevel: 'blue', firebaseToken: null, deletedAt: null }
      const updated = { ...user, beltLevel: 'purple' }

      prisma.user.findFirst.mockResolvedValue(user)
      prisma.$transaction.mockResolvedValue([updated, {}])

      await service.promoteBelt('user-1', gymId, {
        beltLevel: 'purple' as any,
        promotedBy: 'instructor-1',
      })

      // Check that $transaction was called with the right operations list
      const txArgs = prisma.$transaction.mock.calls[0][0]
      // Two operations passed into $transaction
      expect(txArgs).toHaveLength(2)
    })

    it('throws NotFoundException when user does not belong to the gym', async () => {
      prisma.user.findFirst.mockResolvedValue(null)

      await expect(
        service.promoteBelt('user-99', gymId, { beltLevel: 'blue' as any, promotedBy: 'inst' }),
      ).rejects.toThrow(NotFoundException)

      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('sends a push notification when user has a firebaseToken', async () => {
      const user = {
        id: 'user-1',
        gymId,
        beltLevel: 'white',
        firebaseToken: 'fcm-token-abc',
        deletedAt: null,
      }
      const updated = { ...user, beltLevel: 'blue' }

      prisma.user.findFirst.mockResolvedValue(user)
      prisma.$transaction.mockResolvedValue([updated, {}])

      await service.promoteBelt('user-1', gymId, {
        beltLevel: 'blue' as any,
        promotedBy: 'instructor-1',
      })

      // Allow the fire-and-forget promise to settle
      await Promise.resolve()

      expect(notifications.sendPushNotification).toHaveBeenCalledWith(
        'fcm-token-abc',
        expect.any(String),
        expect.stringContaining('Blue'),
        expect.objectContaining({ type: 'belt_promotion', toBelt: 'blue' }),
      )
    })

    it('does not send a push notification when user has no firebaseToken', async () => {
      const user = {
        id: 'user-1',
        gymId,
        beltLevel: 'white',
        firebaseToken: null,
        deletedAt: null,
      }
      const updated = { ...user, beltLevel: 'blue' }

      prisma.user.findFirst.mockResolvedValue(user)
      prisma.$transaction.mockResolvedValue([updated, {}])

      await service.promoteBelt('user-1', gymId, {
        beltLevel: 'blue' as any,
        promotedBy: 'instructor-1',
      })

      await Promise.resolve()

      expect(notifications.sendPushNotification).not.toHaveBeenCalled()
    })
  })

  // ─── findBySupabaseUid (getMe) ───────────────────────────────────────────────

  describe('findBySupabaseUid()', () => {
    it('returns user data when user exists', async () => {
      const user = {
        id: 'user-1',
        supabaseUid: 'uid-1',
        gymId: 'gym-1',
        beltLevel: 'white',
        gym: { name: 'Test Gym', primaryColor: '#000', secondaryColor: '#fff', logoUrl: null },
      }
      prisma.user.findFirst.mockResolvedValue(user)

      const result = await service.findBySupabaseUid('uid-1', 'gym-1')

      expect(result).toEqual(user)
      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ supabaseUid: 'uid-1', gymId: 'gym-1' }),
        }),
      )
    })

    it('throws NotFoundException when user is not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null)

      await expect(service.findBySupabaseUid('uid-missing', 'gym-1')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  // ─── findOne ────────────────────────────────────────────────────────────────

  describe('findOne()', () => {
    it('returns user when found in the correct gym', async () => {
      const user = { id: 'user-1', gymId: 'gym-1', deletedAt: null }
      prisma.user.findFirst.mockResolvedValue(user)

      const result = await service.findOne('user-1', 'gym-1')

      expect(result).toEqual(user)
    })

    it('throws NotFoundException when user does not exist in the gym', async () => {
      prisma.user.findFirst.mockResolvedValue(null)

      await expect(service.findOne('nonexistent', 'gym-1')).rejects.toThrow(NotFoundException)
    })
  })
})
