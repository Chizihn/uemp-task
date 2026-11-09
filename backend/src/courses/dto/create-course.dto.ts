import { IsEnum, IsInt, IsString, Max, Min, MinLength } from 'class-validator';
import { Term } from '@prisma/client';

export class CreateCourseDto {
  @IsString()
  @MinLength(3)
  code!: string;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsInt()
  @Min(1)
  @Max(6)
  units!: number;

  @IsInt()
  @Min(100)
  @Max(700)
  level!: number;

  @IsEnum(Term)
  term!: Term;

  @IsString()
  departmentId!: string;
}
