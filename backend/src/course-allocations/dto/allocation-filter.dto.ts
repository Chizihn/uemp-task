import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class AllocationFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  semesterId?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  lecturerId?: string;

  /** Matches against course code or title, case-insensitive. */
  @IsOptional()
  @IsString()
  search?: string;
}
