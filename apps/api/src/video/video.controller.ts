import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { VideoService } from './video.service';
import { AuthGuard, AuthenticatedUser } from '../auth/auth.guard';
import { IsString, IsNotEmpty } from 'class-validator';

class UploadUrlDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;
}

class ProcessVideoDto {
  @IsString()
  @IsNotEmpty()
  s3Key: string;
}

@Controller('api/v1/video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('upload-url')
  @UseGuards(AuthGuard)
  getUploadUrl(@Body() body: UploadUrlDto, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.videoService.getPresignedUploadUrl(
      user.gymId,
      body.fileName,
      body.contentType,
    );
  }

  @Post('mux-webhook')
  @HttpCode(HttpStatus.OK)
  handleMuxWebhook(
    @Body() body: Record<string, unknown>,
    @Headers('mux-signature') signature: string,
  ) {
    return this.videoService.handleMuxWebhook(body, signature);
  }

  @Post(':techniqueId/process')
  @UseGuards(AuthGuard)
  processVideo(
    @Param('techniqueId') techniqueId: string,
    @Body() body: ProcessVideoDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user as AuthenticatedUser;
    return this.videoService.createMuxUploadFromS3Key(
      user.gymId,
      body.s3Key,
      techniqueId,
    );
  }

  @Get('storage-usage')
  @UseGuards(AuthGuard)
  async getStorageUsage(@Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    const bytes = await this.videoService.getGymStorageUsage(user.gymId);
    const gb = bytes / (1024 * 1024 * 1024);
    return {
      usedBytes: bytes,
      usedGb: Math.round(gb * 100) / 100,
      limitGb: 10,
      percentUsed: Math.round((gb / 10) * 100),
    };
  }
}
