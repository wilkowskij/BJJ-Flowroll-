import { Module } from '@nestjs/common';
import { TechniqueController } from './technique.controller';
import { TechniqueService } from './technique.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TechniqueController],
  providers: [TechniqueService],
  exports: [TechniqueService],
})
export class TechniqueModule {}
