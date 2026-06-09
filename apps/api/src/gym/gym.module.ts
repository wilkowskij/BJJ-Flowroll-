import { Module } from '@nestjs/common';
import { GymController } from './gym.controller';
import { GymService } from './gym.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [GymController],
  providers: [GymService],
  exports: [GymService],
})
export class GymModule {}
