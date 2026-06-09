import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymDto } from './dto/update-gym.dto';

@Injectable()
export class GymService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGymDto) {
    return this.prisma.gym.create({ data: dto });
  }

  async findOne(id: string) {
    const gym = await this.prisma.gym.findUnique({ where: { id } });
    if (!gym) throw new NotFoundException(`Gym ${id} not found`);
    return gym;
  }

  async update(id: string, dto: UpdateGymDto) {
    await this.findOne(id);
    return this.prisma.gym.update({ where: { id }, data: dto });
  }
}
