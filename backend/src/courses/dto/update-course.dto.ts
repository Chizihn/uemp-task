import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Term } from '@prisma/client';

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  units?: number;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(700)
  level?: number;

  @IsOptional()
  @IsEnum(Term)
  term?: Term;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
