import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateSupportMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  message!: string;
}


