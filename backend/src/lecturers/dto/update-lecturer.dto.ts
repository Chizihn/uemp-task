import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateLecturerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  staffId?: string;

  @IsOptional()
  @IsString()
  title?: string;
}
