import { IsOptional, IsString, MinLength } from 'class-validator';

export class ReopenResultDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  reason?: string;
}
