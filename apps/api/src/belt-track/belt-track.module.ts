import { Module } from '@nestjs/common';
import { BeltTrackController } from './belt-track.controller';
import { BeltTrackService } from './belt-track.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BeltTrackController],
  providers: [BeltTrackService],
  exports: [BeltTrackService],
})
export class BeltTrackModule {}
