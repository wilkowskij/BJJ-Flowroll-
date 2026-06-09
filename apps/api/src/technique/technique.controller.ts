import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { TechniqueService } from './technique.service';
import { AuthGuard, AuthenticatedUser } from '../auth/auth.guard';
import { CreateTechniqueDto } from './dto/create-technique.dto';
import { UpdateTechniqueDto } from './dto/update-technique.dto';
import { FilterTechniqueDto } from './dto/filter-technique.dto';

@Controller('api/v1/techniques')
@UseGuards(AuthGuard)
export class TechniqueController {
  constructor(private readonly techniqueService: TechniqueService) {}

  @Get('templates')
  findTemplates() {
    return this.techniqueService.findTemplates();
  }

  @Get()
  findAll(@Req() req: Request, @Query() filters: FilterTechniqueDto) {
    const user = (req as any).user as AuthenticatedUser;
    return this.techniqueService.findAll(user.gymId, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.techniqueService.findOne(id, user.gymId);
  }

  @Post()
  create(@Body() dto: CreateTechniqueDto, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.techniqueService.create(user.gymId, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTechniqueDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user as AuthenticatedUser;
    return this.techniqueService.update(id, user.gymId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.techniqueService.remove(id, user.gymId);
  }
}
