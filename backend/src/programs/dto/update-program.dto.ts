import { IsBoolean, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class UpdateProgramDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  code?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  durationYears?: number;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(700)
  maxLevel?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
