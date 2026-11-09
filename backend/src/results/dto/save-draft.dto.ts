import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class SaveDraftDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30)
  caScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(70)
  examScore?: number;
}
