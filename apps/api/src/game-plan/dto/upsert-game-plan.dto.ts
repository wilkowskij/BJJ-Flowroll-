import { IsObject } from 'class-validator';

export class UpsertGamePlanDto {
  @IsObject()
  positions: Record<string, unknown>;
}
