import { IsString } from 'class-validator';

export class CreateAllocationDto {
  @IsString()
  courseId!: string;

  @IsString()
  lecturerId!: string;

  @IsString()
  sessionId!: string;

  @IsString()
  semesterId!: string;
}
