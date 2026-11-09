import { IsString, MinLength } from 'class-validator';

export class RejectResultDto {
  @IsString()
  @MinLength(3)
  reason!: string;
}
