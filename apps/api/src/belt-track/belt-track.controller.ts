import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { BeltLevel } from '@prisma/client';
import { BeltTrackService } from './belt-track.service';
import { AuthGuard, AuthenticatedUser } from '../auth/auth.guard';
import { UpdateBeltTrackDto } from './dto/update-belt-track.dto';

@Controller('api/v1/belt-tracks')
@UseGuards(AuthGuard)
export class BeltTrackController {
  constructor(private readonly beltTrackService: BeltTrackService) {}

  @Get(':beltLevel')
  findOne(@Param('beltLevel') beltLevel: BeltLevel, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.beltTrackService.findOne(user.gymId, beltLevel);
  }

  @Put(':beltLevel')
  upsert(
    @Param('beltLevel') beltLevel: BeltLevel,
    @Body() dto: UpdateBeltTrackDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user as AuthenticatedUser;
    return this.beltTrackService.upsert(user.gymId, beltLevel, dto);
  }
}
