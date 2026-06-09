import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerModule } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { GymThrottlerGuard } from './auth/gym-throttler.guard'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { GymModule } from './gym/gym.module'
import { UserModule } from './user/user.module'
import { TechniqueModule } from './technique/technique.module'
import { FlowchartModule } from './flowchart/flowchart.module'
import { WeeklyPostModule } from './weekly-post/weekly-post.module'
import { BeltTrackModule } from './belt-track/belt-track.module'
import { AttendanceModule } from './attendance/attendance.module'
import { SubscriptionModule } from './subscription/subscription.module'
import { VideoModule } from './video/video.module'
import { NotificationModule } from './notification/notification.module'
import { AnnouncementModule } from './announcement/announcement.module'
import { RedisModule } from './redis/redis.module'
import { GamePlanModule } from './game-plan/game-plan.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 }, // 20 req/sec burst
      { name: 'medium', ttl: 60000, limit: 200 }, // 200 req/min sustained
    ]),
    PrismaModule,
    RedisModule,
    AuthModule,
    GymModule,
    UserModule,
    TechniqueModule,
    FlowchartModule,
    WeeklyPostModule,
    BeltTrackModule,
    AttendanceModule,
    SubscriptionModule,
    VideoModule,
    NotificationModule,
    AnnouncementModule,
    GamePlanModule,
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: GymThrottlerGuard }],
})
export class AppModule {}
