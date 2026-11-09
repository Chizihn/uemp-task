import { IsString } from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  courseAllocationId!: string;
}
