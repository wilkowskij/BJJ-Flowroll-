import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateBeltDto } from './dto/update-belt.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySupabaseUid(supabaseUid: string, gymId: string) {
    const user = await this.prisma.user.findFirst({
      where: { supabaseUid, gymId, deletedAt: null },
      include: { gym: { select: { name: true, primaryColor: true, secondaryColor: true, logoUrl: true } } },
    });
    if (!user) throw new NotFoundException(`User not found`);
    return user;
  }

  async findAll(gymId: string) {
    return this.prisma.user.findMany({
      where: { gymId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, gymId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, gymId, deletedAt: null },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async promoteBelt(id: string, gymId: string, dto: UpdateBeltDto) {
    const user = await this.findOne(id, gymId);

    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { beltLevel: dto.beltLevel },
      }),
      this.prisma.beltPromotion.create({
        data: {
          userId: id,
          promotedBy: dto.promotedBy,
          fromBelt: user.beltLevel,
          toBelt: dto.beltLevel,
        },
      }),
    ]);

    return updatedUser;
  }
}
