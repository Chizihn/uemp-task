import { IsString } from 'class-validator';

export class UpdateAllocationDto {
  @IsString()
  lecturerId!: string;
}
