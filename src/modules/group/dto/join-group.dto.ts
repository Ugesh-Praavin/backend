import { IsNumber } from 'class-validator';

export class JoinGroupDto {
  @IsNumber()
  group_id: number;
}
