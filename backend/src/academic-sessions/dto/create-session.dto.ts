import { IsString, Matches } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @Matches(/^\d{4}\/\d{4}$/, { message: 'name must look like "2024/2025"' })
  name!: string;
}
