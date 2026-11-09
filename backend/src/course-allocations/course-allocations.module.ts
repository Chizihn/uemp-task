import { Module } from '@nestjs/common';
import { CourseAllocationsService } from './course-allocations.service';
import { CourseAllocationsController } from './course-allocations.controller';

@Module({
  controllers: [CourseAllocationsController],
  providers: [CourseAllocationsService],
  exports: [CourseAllocationsService],
})
export class CourseAllocationsModule {}
