import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLecturerDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  staffId!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  departmentId!: string;
}
