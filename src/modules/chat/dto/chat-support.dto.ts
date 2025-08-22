import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class ChatSupportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000) // Maximum 1000 characters for chat messages
  message: string;
}
