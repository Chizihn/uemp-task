import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class RegistrationFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  semesterId?: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  courseAllocationId?: string;

  /** Matches against the student's matric number or email, case-insensitive. */
  @IsOptional()
  @IsString()
  search?: string;
}
