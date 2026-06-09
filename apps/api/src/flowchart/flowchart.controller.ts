import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { FlowchartService } from './flowchart.service';
import { AuthGuard, AuthenticatedUser } from '../auth/auth.guard';
import { SaveFlowchartDto } from './dto/save-flowchart.dto';

@Controller('api/v1/flowcharts')
@UseGuards(AuthGuard)
export class FlowchartController {
  constructor(private readonly flowchartService: FlowchartService) {}

  @Get('templates')
  getTemplates(@Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.flowchartService.getTemplates(user.gymId);
  }

  @Get('me')
  getMyFlowchart(@Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.flowchartService.getMyFlowchart(user.supabaseUid, user.gymId);
  }

  @Put('me')
  saveMyFlowchart(@Body() dto: SaveFlowchartDto, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.flowchartService.saveMyFlowchart(user.supabaseUid, user.gymId, dto);
  }
}
