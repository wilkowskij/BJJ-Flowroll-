import { Controller, Get, Patch, Put, Param, Body, UseGuards, Req } from '@nestjs/common'
import { Request } from 'express'
import { IsString, IsNotEmpty } from 'class-validator'
import { UserService } from './user.service'
import { AuthGuard, AuthenticatedUser } from '../auth/auth.guard'
import { GymContext } from '../auth/gym-context.decorator'
import { Roles } from '../auth/roles.decorator'
import { UpdateBeltDto } from './dto/update-belt.dto'
import { NotificationPreferencesDto } from './dto/notification-preferences.dto'

class UpdateFcmTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string
}

@Controller('api/v1/users')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(@Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser
    return this.userService.findAll(user.gymId)
  }

  @Get('me')
  getMe(@Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser
    return this.userService.findBySupabaseUid(user.supabaseUid, user.gymId)
  }

  @Get('me/progress')
  getProgressSummary(@Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser
    return this.userService.getProgressSummary(user.supabaseUid, user.gymId)
  }

  @Get('students')
  @Roles('instructor', 'owner', 'platform_admin')
  getStudentEngagement(@GymContext() gymId: string) {
    return this.userService.getStudentEngagement(gymId)
  }

  @Put('me/fcm-token')
  updateFcmToken(@Body() dto: UpdateFcmTokenDto, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser
    return this.userService.updateFcmToken(user.supabaseUid, user.gymId, dto.token)
  }

  @Put('me/notification-preferences')
  updateNotificationPreferences(
    @GymContext() gymId: string,
    @Req() req: Request,
    @Body() body: NotificationPreferencesDto,
  ) {
    const user = (req as any).user as AuthenticatedUser
    return this.userService.updateNotificationPreferences(user.supabaseUid, body)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser
    return this.userService.findOne(id, user.gymId)
  }

  @Patch(':id/belt')
  promoteBelt(@Param('id') id: string, @Body() dto: UpdateBeltDto, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser
    return this.userService.promoteBelt(id, user.gymId, dto)
  }
}
