import { IsString, IsNotEmpty, MaxLength, IsOptional, IsArray } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000) // Maximum 2000 characters for post content
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  mood?: string; // Optional mood indicator (e.g., "happy", "sad", "anxious")

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]; // Optional tags for categorization

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string; // Optional category (e.g., "support", "celebration", "question")
}
