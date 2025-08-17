import { IsString, IsNotEmpty } from 'class-validator';

export class JoinGroupDto {
  @IsString()
  @IsNotEmpty()
  group_id: string;
}
