import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { GamePlanService } from './game-plan.service';
import { AuthGuard, AuthenticatedUser } from '../auth/auth.guard';
import { UpsertGamePlanDto } from './dto/upsert-game-plan.dto';

@Controller('api/v1/game-plan')
@UseGuards(AuthGuard)
export class GamePlanController {
  constructor(private readonly gamePlanService: GamePlanService) {}

  @Get()
  getGamePlan(@Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.gamePlanService.getGamePlan(user.supabaseUid, user.gymId);
  }

  @Put()
  upsertGamePlan(@Body() dto: UpsertGamePlanDto, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.gamePlanService.upsertGamePlan(user.supabaseUid, user.gymId, dto);
  }
}
