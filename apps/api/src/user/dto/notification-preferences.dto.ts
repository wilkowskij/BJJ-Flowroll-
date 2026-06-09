import { IsBoolean, IsOptional } from 'class-validator'

export class NotificationPreferencesDto {
  @IsBoolean()
  @IsOptional()
  announcements?: boolean

  @IsBoolean()
  @IsOptional()
  beltPromotions?: boolean

  @IsBoolean()
  @IsOptional()
  weeklyPosts?: boolean

  @IsBoolean()
  @IsOptional()
  classReminders?: boolean
}
