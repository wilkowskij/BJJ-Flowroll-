import { PartialType } from '@nestjs/mapped-types';
import { CreateWeeklyPostDto } from './create-weekly-post.dto';

export class UpdateWeeklyPostDto extends PartialType(CreateWeeklyPostDto) {}
