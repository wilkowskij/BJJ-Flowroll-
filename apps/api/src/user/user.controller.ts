import {
  Controller,
  Get,
  Patch,
  Put,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { IsString, IsNotEmpty } from 'class-validator';
import { UserService } from './user.service';
import { AuthGuard, AuthenticatedUser } from '../auth/auth.guard';
import { UpdateBeltDto } from './dto/update-belt.dto';

class UpdateFcmTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

@Controller('api/v1/users')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(@Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.userService.findAll(user.gymId);
  }

  @Get('me')
  getMe(@Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.userService.findBySupabaseUid(user.supabaseUid, user.gymId);
  }

  @Get('me/progress')
  getProgressSummary(@Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.userService.getProgressSummary(user.supabaseUid, user.gymId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.userService.findOne(id, user.gymId);
  }

  @Put('me/fcm-token')
  updateFcmToken(@Body() dto: UpdateFcmTokenDto, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.userService.updateFcmToken(user.supabaseUid, user.gymId, dto.token);
  }

  @Patch(':id/belt')
  promoteBelt(
    @Param('id') id: string,
    @Body() dto: UpdateBeltDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user as AuthenticatedUser;
    return this.userService.promoteBelt(id, user.gymId, dto);
  }
}
