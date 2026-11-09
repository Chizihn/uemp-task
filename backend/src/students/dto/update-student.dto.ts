import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  matricNumber?: string;

  @IsOptional()
  @IsString()
  programId?: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(700)
  level?: number;
}
