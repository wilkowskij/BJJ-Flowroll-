import { Module } from '@nestjs/common';
import { WeeklyPostController } from './weekly-post.controller';
import { WeeklyPostService } from './weekly-post.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [AuthModule, NotificationModule],
  controllers: [WeeklyPostController],
  providers: [WeeklyPostService],
  exports: [WeeklyPostService],
})
export class WeeklyPostModule {}
