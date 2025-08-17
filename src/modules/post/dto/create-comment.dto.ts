import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500) // Maximum 500 characters for comments
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  support_type?: string; // Type of support (e.g., "encouragement", "advice", "empathy")
}
