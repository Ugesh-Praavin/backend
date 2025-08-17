import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class SupportPostDto {
  @IsString()
  @IsNotEmpty()
  support_type: string; // "like", "hug", "prayer", "encouragement", "advice"

  @IsOptional()
  @IsString()
  @MaxLength(100)
  message?: string; // Optional short message with support
}
