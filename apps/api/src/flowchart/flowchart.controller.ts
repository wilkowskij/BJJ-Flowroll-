import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
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
  listTemplates(@Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.flowchartService.listTemplates(user.gymId);
  }

  @Post(':id/clone')
  cloneTemplate(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.flowchartService.cloneTemplate(id, user.supabaseUid, user.gymId);
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
