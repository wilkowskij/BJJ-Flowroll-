import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { GymService } from './gym.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymDto } from './dto/update-gym.dto';

@Controller('api/v1/gyms')
export class GymController {
  constructor(private readonly gymService: GymService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() dto: CreateGymDto) {
    return this.gymService.create(dto);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.gymService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateGymDto) {
    return this.gymService.update(id, dto);
  }
}
