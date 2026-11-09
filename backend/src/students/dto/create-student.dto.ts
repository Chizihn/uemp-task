import { IsEmail, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(3)
  matricNumber!: string;

  @IsString()
  departmentId!: string;

  @IsString()
  programId!: string;

  @IsInt()
  @Min(100)
  @Max(700)
  level!: number;
}
