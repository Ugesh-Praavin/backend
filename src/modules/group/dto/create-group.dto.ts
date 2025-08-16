import { IsString, IsEnum, IsOptional } from 'class-validator';
import { GroupType } from '../../../common/enums/group-type.enum';

export class CreateGroupDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsEnum(GroupType)
  type: GroupType;

  @IsOptional()
  expires_in_hours?: number; // For temporary groups
}