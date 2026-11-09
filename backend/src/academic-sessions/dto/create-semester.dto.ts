import { IsEnum } from 'class-validator';
import { Term } from '@prisma/client';

export class CreateSemesterDto {
  @IsEnum(Term)
  term!: Term;
}
