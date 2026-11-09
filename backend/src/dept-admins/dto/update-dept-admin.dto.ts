import { IsString } from 'class-validator';

export class UpdateDeptAdminDto {
  @IsString()
  departmentId!: string;
}
