import { Module } from '@nestjs/common';
import { GamePlanController } from './game-plan.controller';
import { GamePlanService } from './game-plan.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [GamePlanController],
  providers: [GamePlanService],
  exports: [GamePlanService],
})
export class GamePlanModule {}
