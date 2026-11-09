import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateFacultyDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  code?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
