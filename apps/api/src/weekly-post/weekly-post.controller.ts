import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { WeeklyPostService } from './weekly-post.service';
import { AuthGuard, AuthenticatedUser } from '../auth/auth.guard';
import { CreateWeeklyPostDto } from './dto/create-weekly-post.dto';
import { UpdateWeeklyPostDto } from './dto/update-weekly-post.dto';

@Controller('api/v1/weekly-posts')
@UseGuards(AuthGuard)
export class WeeklyPostController {
  constructor(private readonly weeklyPostService: WeeklyPostService) {}

  @Get('feed')
  getFeed(@Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.weeklyPostService.getFeed(user.gymId);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.weeklyPostService.findAll(user.gymId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.weeklyPostService.findOne(id, user.gymId);
  }

  @Post()
  create(@Body() dto: CreateWeeklyPostDto, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.weeklyPostService.create(user.gymId, user.supabaseUid, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWeeklyPostDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user as AuthenticatedUser;
    return this.weeklyPostService.update(id, user.gymId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.weeklyPostService.remove(id, user.gymId);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.weeklyPostService.publish(id, user.gymId);
  }
}
