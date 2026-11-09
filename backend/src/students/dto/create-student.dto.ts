import { IsEmail, IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateStudentDto {
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
