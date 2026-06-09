import { Module } from '@nestjs/common';
import { FlowchartController } from './flowchart.controller';
import { FlowchartService } from './flowchart.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FlowchartController],
  providers: [FlowchartService],
  exports: [FlowchartService],
})
export class FlowchartModule {}
