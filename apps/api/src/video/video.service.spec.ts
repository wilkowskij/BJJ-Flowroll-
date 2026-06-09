import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { VideoService } from './video.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock heavy AWS and Mux SDKs so the test doesn't need real credentials
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({})),
  PutObjectCommand: jest.fn().mockImplementation((input) => input),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://s3.example.com/presigned-url'),
}));

jest.mock('@mux/mux-node', () =>
  jest.fn().mockImplementation(() => ({
    video: { assets: { create: jest.fn() } },
    webhooks: { verifySignature: jest.fn() },
  })),
);

describe('VideoService', () => {
  let service: VideoService;

  const mockPrisma = {
    technique: { count: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    weeklyPost: { updateMany: jest.fn() },
  };

  const mockConfig = {
    get: jest.fn((key: string, fallback?: string) => fallback ?? ''),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<VideoService>(VideoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPresignedUploadUrl', () => {
    const gymId = 'gym-abc';
    const fileName = 'technique-demo.mp4';
    const contentType = 'video/mp4';

    it('succeeds when storage usage is below 10 GB (9 GB used)', async () => {
      const nineGb = 9 * 1024 * 1024 * 1024;
      jest.spyOn(service, 'getGymStorageUsage').mockResolvedValue(nineGb);

      const result = await service.getPresignedUploadUrl(gymId, fileName, contentType);

      expect(result).toHaveProperty('uploadUrl');
      expect(result).toHaveProperty('s3Key');
      expect(result.uploadUrl).toContain('https://');
      expect(result.s3Key).toContain(`gyms/${gymId}/videos/`);
    });

    it('throws "Storage quota exceeded" when usage is at or above 10 GB', async () => {
      const tenGb = 10 * 1024 * 1024 * 1024;
      jest.spyOn(service, 'getGymStorageUsage').mockResolvedValue(tenGb);

      await expect(
        service.getPresignedUploadUrl(gymId, fileName, contentType),
      ).rejects.toThrow('Storage quota exceeded');
    });

    it('throws when usage is above 10 GB', async () => {
      const elevenGb = 11 * 1024 * 1024 * 1024;
      jest.spyOn(service, 'getGymStorageUsage').mockResolvedValue(elevenGb);

      await expect(
        service.getPresignedUploadUrl(gymId, fileName, contentType),
      ).rejects.toThrow('Storage quota exceeded');
    });

    it('succeeds when storage usage is exactly 0', async () => {
      jest.spyOn(service, 'getGymStorageUsage').mockResolvedValue(0);

      const result = await service.getPresignedUploadUrl(gymId, fileName, contentType);
      expect(result).toHaveProperty('uploadUrl');
    });
  });
});
