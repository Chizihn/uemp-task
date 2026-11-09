import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class LecturerFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  /** Matches against staff ID, title, or email, case-insensitive. */
  @IsOptional()
  @IsString()
  search?: string;
}
