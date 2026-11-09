import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Term } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CourseFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(700)
  level?: number;

  @IsOptional()
  @IsEnum(Term)
  term?: Term;

  /** Matches against course code or title, case-insensitive. */
  @IsOptional()
  @IsString()
  search?: string;
}
