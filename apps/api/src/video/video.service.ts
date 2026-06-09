import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import Mux from '@mux/mux-node';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly s3: S3Client;
  private readonly mux: Mux;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });

    this.mux = new Mux({
      tokenId: this.configService.get<string>('MUX_TOKEN_ID', ''),
      tokenSecret: this.configService.get<string>('MUX_TOKEN_SECRET', ''),
    });
  }

  async getUploadUrl(gymId: string, filename: string): Promise<{ uploadUrl: string; key: string }> {
    const bucket = this.configService.get<string>('AWS_S3_BUCKET', 'flowmat-videos');
    const key = `uploads/${gymId}/${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: 'video/*',
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

    return { uploadUrl, key };
  }

  async handleMuxWebhook(body: any, signature: string): Promise<void> {
    const webhookSecret = this.configService.get<string>('MUX_WEBHOOK_SECRET', '');

    try {
      this.mux.webhooks.verifySignature(
        JSON.stringify(body),
        { 'mux-signature': signature },
        webhookSecret,
      );
    } catch (err) {
      this.logger.error('Invalid Mux webhook signature');
      throw err;
    }

    const eventType: string = body.type;
    this.logger.log(`Received Mux webhook: ${eventType}`);

    switch (eventType) {
      case 'video.asset.ready':
        await this.onAssetReady(body.data);
        break;
      case 'video.asset.errored':
        this.logger.error(`Mux asset errored: ${body.data?.id}`);
        break;
      default:
        this.logger.log(`Unhandled Mux event: ${eventType}`);
    }
  }

  private async onAssetReady(data: any): Promise<void> {
    const assetId: string = data?.id;
    const playbackId: string = data?.playback_ids?.[0]?.id;
    this.logger.log(`Mux asset ready — assetId: ${assetId}, playbackId: ${playbackId}`);
    // TODO: Update Technique or WeeklyPost with muxAssetId + muxPlaybackId
  }
}
