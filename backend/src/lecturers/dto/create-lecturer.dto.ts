import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLecturerDto {
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
  @MinLength(2)
  staffId!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  departmentId!: string;
}
