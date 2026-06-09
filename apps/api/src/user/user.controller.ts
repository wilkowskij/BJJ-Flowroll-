import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { AuthGuard, AuthenticatedUser } from '../auth/auth.guard';
import { UpdateBeltDto } from './dto/update-belt.dto';

@Controller('api/v1/users')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(@Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.userService.findAll(user.gymId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.userService.findOne(id, user.gymId);
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
