import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.interface';
import { ResultsService } from './results.service';
import { SaveDraftDto } from './dto/save-draft.dto';
import { RejectResultDto } from './dto/reject-result.dto';
import { PendingResultsFilterDto } from './dto/pending-results-filter.dto';
import { ReopenResultDto } from './dto/reopen-result.dto';

@Controller('results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get('class-list/:courseAllocationId')
  @Roles(Role.SUPER_ADMIN, Role.DEPT_ADMIN, Role.LECTURER)
  getClassList(
    @Param('courseAllocationId') courseAllocationId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.resultsService.getClassList(courseAllocationId, actor);
  }

  @Patch(':registrationId/draft')
  @Roles(Role.LECTURER)
  saveDraft(
    @Param('registrationId') registrationId: string,
    @Body() dto: SaveDraftDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.resultsService.saveDraft(registrationId, dto, actor);
  }

  @Post(':registrationId/submit')
  @Roles(Role.LECTURER)
  submit(@Param('registrationId') registrationId: string, @CurrentUser() actor: AuthUser) {
    return this.resultsService.submit(registrationId, actor);
  }

  @Get('my-submissions')
  @Roles(Role.LECTURER)
  getMySubmissions(@CurrentUser() actor: AuthUser) {
    return this.resultsService.findMySubmissions(actor);
  }

  @Get('pending')
  @Roles(Role.SUPER_ADMIN, Role.DEPT_ADMIN)
  getPending(@CurrentUser() actor: AuthUser, @Query() filter: PendingResultsFilterDto) {
    return this.resultsService.findPending(actor, filter);
  }

  @Post(':id/approve')
  @Roles(Role.SUPER_ADMIN, Role.DEPT_ADMIN)
  approve(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.resultsService.approve(id, actor);
  }

  @Post(':id/reject')
  @Roles(Role.SUPER_ADMIN, Role.DEPT_ADMIN)
  reject(@Param('id') id: string, @Body() dto: RejectResultDto, @CurrentUser() actor: AuthUser) {
    return this.resultsService.reject(id, dto.reason, actor);
  }

  @Post(':id/reopen')
  @Roles(Role.SUPER_ADMIN, Role.DEPT_ADMIN)
  reopen(@Param('id') id: string, @Body() dto: ReopenResultDto, @CurrentUser() actor: AuthUser) {
    return this.resultsService.reopen(id, actor, dto.reason);
  }

  @Get('me')
  @Roles(Role.STUDENT)
  getMyResults(@CurrentUser() actor: AuthUser) {
    return this.resultsService.findMyResults(actor);
  }
}
