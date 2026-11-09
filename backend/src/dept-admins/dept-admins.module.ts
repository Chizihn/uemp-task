import { Module } from '@nestjs/common';
import { DeptAdminsService } from './dept-admins.service';
import { DeptAdminsController } from './dept-admins.controller';

@Module({
  controllers: [DeptAdminsController],
  providers: [DeptAdminsService],
  exports: [DeptAdminsService],
})
export class DeptAdminsModule {}
