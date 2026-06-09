import {
  Controller,
  Post,
  Body,
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
  filename: string;
}

@Controller('api/v1/video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('upload-url')
  @UseGuards(AuthGuard)
  getUploadUrl(@Body() body: UploadUrlDto, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.videoService.getUploadUrl(user.gymId, body.filename);
  }

  @Post('mux-webhook')
  @HttpCode(HttpStatus.OK)
  handleMuxWebhook(
    @Body() body: any,
    @Headers('mux-signature') signature: string,
  ) {
    return this.videoService.handleMuxWebhook(body, signature);
  }
}
