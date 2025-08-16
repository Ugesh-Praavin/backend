import { IsString, IsNumber, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsNumber()
  group_id: number;

  @IsString()
  @MaxLength(100)
  message: string;
}