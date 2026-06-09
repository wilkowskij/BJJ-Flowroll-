import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { AnnouncementService } from './announcement.service';
import { AuthGuard, AuthenticatedUser } from '../auth/auth.guard';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Controller('api/v1/announcements')
@UseGuards(AuthGuard)
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Get()
  findAll(@Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.announcementService.findAll(user.gymId);
  }

  @Post()
  create(@Body() dto: CreateAnnouncementDto, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.announcementService.create(user.gymId, user.supabaseUid, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.announcementService.remove(id, user.gymId);
  }
}
