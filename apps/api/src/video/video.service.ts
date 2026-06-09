import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import Mux from '@mux/mux-node';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly s3: S3Client;
  private readonly mux: Mux;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.s3 = new S3Client({
      region: config.get<string>('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: config.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });

    this.mux = new Mux({
      tokenId: config.get<string>('MUX_TOKEN_ID', ''),
      tokenSecret: config.get<string>('MUX_TOKEN_SECRET', ''),
    });
  }

  async getPresignedUploadUrl(
    gymId: string,
    fileName: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; s3Key: string }> {
    // Check storage quota (10 GB cap per gym)
    const usageBytes = await this.getGymStorageUsage(gymId);
    const tenGbBytes = 10 * 1024 * 1024 * 1024;
    if (usageBytes >= tenGbBytes) {
      throw new Error('Storage quota exceeded. Upgrade your plan or delete videos.');
    }

    const key = `gyms/${gymId}/videos/${createId()}-${fileName}`;
    const command = new PutObjectCommand({
      Bucket: this.config.get<string>('AWS_S3_BUCKET', 'flowmat-videos'),
      Key: key,
      ContentType: contentType,
      Metadata: { gymId },
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    return { uploadUrl, s3Key: key };
  }

  async handleMuxWebhook(
    payload: Record<string, unknown>,
    signature: string,
  ): Promise<void> {
    const webhookSecret = this.config.get<string>('MUX_WEBHOOK_SECRET', '');

    try {
      this.mux.webhooks.verifySignature(
        JSON.stringify(payload),
        { 'mux-signature': signature },
        webhookSecret,
      );
    } catch (err) {
      this.logger.error('Invalid Mux webhook signature');
      throw err;
    }

    const eventType = payload.type as string;
    this.logger.log(`Received Mux webhook: ${eventType}`);

    if (eventType === 'video.asset.ready') {
      const data = payload.data as Record<string, unknown>;
      const muxAssetId = data?.id as string;
      const playbackIds = data?.playback_ids as Array<{ id: string }> | undefined;
      const muxPlaybackId = playbackIds?.[0]?.id;

      if (muxAssetId && muxPlaybackId) {
        const playbackUrl = `https://stream.mux.com/${muxPlaybackId}.m3u8`;

        const [techniques, posts] = await Promise.all([
          this.prisma.technique.updateMany({
            where: { muxAssetId },
            data: { muxPlaybackId, videoUrl: playbackUrl },
          }),
          this.prisma.weeklyPost.updateMany({
            where: { muxAssetId },
            data: { muxPlaybackId, videoUrl: playbackUrl },
          }),
        ]);

        this.logger.log(
          `Mux asset ready — playbackId=${muxPlaybackId}: updated ${techniques.count} technique(s), ${posts.count} post(s)`,
        );
      }
    } else if (eventType === 'video.asset.errored') {
      const data = payload.data as Record<string, unknown>;
      this.logger.error(`Mux asset errored: ${data?.id}`);
    } else {
      this.logger.log(`Unhandled Mux event: ${eventType}`);
    }
  }

  async createMuxUploadFromS3Key(
    gymId: string,
    s3Key: string,
    techniqueId: string,
  ): Promise<{ muxAssetId: string }> {
    const s3Url = this.buildS3Url(s3Key);
    const asset = await this.mux.video.assets.create({
      input: [{ url: s3Url }],
      playback_policy: ['public'],
      meta: { gymId, techniqueId },
    });

    await this.prisma.technique.update({
      where: { id: techniqueId },
      data: { muxAssetId: asset.id },
    });

    return { muxAssetId: asset.id };
  }

  async createMuxUploadFromS3KeyForPost(
    gymId: string,
    s3Key: string,
    weeklyPostId: string,
  ): Promise<{ muxAssetId: string }> {
    const s3Url = this.buildS3Url(s3Key);
    const asset = await this.mux.video.assets.create({
      input: [{ url: s3Url }],
      playback_policy: ['public'],
      meta: { gymId, weeklyPostId },
    });

    await this.prisma.weeklyPost.update({
      where: { id: weeklyPostId },
      data: { muxAssetId: asset.id },
    });

    return { muxAssetId: asset.id };
  }

  private buildS3Url(s3Key: string): string {
    const bucket = this.config.get<string>('AWS_S3_BUCKET', 'flowmat-videos');
    const region = this.config.get<string>('AWS_REGION', 'us-east-1');
    return `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
  }

  async getGymStorageUsage(gymId: string): Promise<number> {
    // Count techniques with video in this gym and estimate storage.
    // In production this would query Mux's storage API.
    // Using a simple count × average size estimate (150 MB/video).
    const count = await this.prisma.technique.count({
      where: { gymId, muxAssetId: { not: null } },
    });
    return count * 150 * 1024 * 1024;
  }
}
