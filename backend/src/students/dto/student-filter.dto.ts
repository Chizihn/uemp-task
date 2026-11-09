import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { UserStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class StudentFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  programId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(700)
  level?: number;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  /** Matches against matric number or email, case-insensitive. */
  @IsOptional()
  @IsString()
  search?: string;
}
