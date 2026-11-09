import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateProgramDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  code!: string;

  @IsString()
  departmentId!: string;

  @IsInt()
  @Min(1)
  @Max(7)
  durationYears!: number;

  @IsInt()
  @Min(100)
  @Max(700)
  maxLevel!: number;
}
