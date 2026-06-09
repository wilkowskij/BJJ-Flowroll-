import { Test, TestingModule } from '@nestjs/testing';
import { BeltTrackService } from './belt-track.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BeltTrackService', () => {
  let service: BeltTrackService;
  let prisma: {
    user: { findUnique: jest.Mock };
    beltTrack: { findUnique: jest.Mock };
    techniqueLog: { findMany: jest.Mock };
    attendance: { count: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      beltTrack: { findUnique: jest.fn() },
      techniqueLog: { findMany: jest.fn() },
      attendance: { count: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BeltTrackService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<BeltTrackService>(BeltTrackService);
  });

  describe('getStudentProgress', () => {
    const gymId = 'gym-1';
    const supabaseUid = 'uid-student';

    const baseUser = {
      id: 'user-1',
      beltLevel: 'blue' as const,
    };

    const baseBeltTrack = {
      requiredTechniqueIds: ['t1', 't2', 't3'],
      requiredClasses: 30,
    };

    it('returns correct percentage when some techniques are logged', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.beltTrack.findUnique.mockResolvedValue(baseBeltTrack);
      // 2 of 3 required techniques logged
      prisma.techniqueLog.findMany.mockResolvedValue([
        { techniqueId: 't1' },
        { techniqueId: 't2' },
      ]);
      prisma.attendance.count.mockResolvedValue(10);

      const result = await service.getStudentProgress(gymId, supabaseUid);

      expect(result).not.toBeNull();
      expect(result!.loggedTechniqueIds).toHaveLength(2);
      expect(result!.requiredTechniques).toHaveLength(3);
      // 2/3 ≈ 66.7% — verify the returned data is correct for a consumer to compute %
      const pct = result!.loggedTechniqueIds.length / result!.requiredTechniques.length;
      expect(pct).toBeCloseTo(2 / 3);
    });

    it('returns 0% when no techniques are logged', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.beltTrack.findUnique.mockResolvedValue(baseBeltTrack);
      prisma.techniqueLog.findMany.mockResolvedValue([]);
      prisma.attendance.count.mockResolvedValue(0);

      const result = await service.getStudentProgress(gymId, supabaseUid);

      expect(result).not.toBeNull();
      expect(result!.loggedTechniqueIds).toHaveLength(0);
      const pct = result!.loggedTechniqueIds.length / result!.requiredTechniques.length;
      expect(pct).toBe(0);
    });

    it('returns 100% when all techniques are logged', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.beltTrack.findUnique.mockResolvedValue(baseBeltTrack);
      // All 3 required techniques logged
      prisma.techniqueLog.findMany.mockResolvedValue([
        { techniqueId: 't1' },
        { techniqueId: 't2' },
        { techniqueId: 't3' },
      ]);
      prisma.attendance.count.mockResolvedValue(30);

      const result = await service.getStudentProgress(gymId, supabaseUid);

      expect(result).not.toBeNull();
      expect(result!.loggedTechniqueIds).toHaveLength(3);
      const pct = result!.loggedTechniqueIds.length / result!.requiredTechniques.length;
      expect(pct).toBe(1);
    });

    it('returns null gracefully when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getStudentProgress(gymId, supabaseUid);

      expect(result).toBeNull();
      expect(prisma.beltTrack.findUnique).not.toHaveBeenCalled();
    });

    it('handles missing BeltTrack and returns empty required arrays', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.beltTrack.findUnique.mockResolvedValue(null); // no BeltTrack configured
      prisma.techniqueLog.findMany.mockResolvedValue([{ techniqueId: 't1' }]);
      prisma.attendance.count.mockResolvedValue(5);

      const result = await service.getStudentProgress(gymId, supabaseUid);

      expect(result).not.toBeNull();
      expect(result!.requiredTechniques).toEqual([]);
      expect(result!.requiredClasses).toBe(0);
      // loggedTechniqueIds is still populated from logs
      expect(result!.loggedTechniqueIds).toHaveLength(1);
    });
  });
});
