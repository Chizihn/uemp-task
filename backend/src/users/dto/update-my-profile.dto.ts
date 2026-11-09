import { IsOptional, IsString, IsUrl } from 'class-validator';

/**
 * Deliberately thin: name, email, role, matric/staff numbers, department,
 * and level are institutional records, not self-service fields, so they're
 * not here — only the fields a user is actually permitted to change
 * themselves (spec §2: "update permitted personal profile information").
 */
export class UpdateMyProfileDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
