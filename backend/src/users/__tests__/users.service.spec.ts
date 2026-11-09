import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import { UsersService } from '../users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { AuditAction } from '../../audit-log/audit-action.constants';
import * as passwordUtil from '../../common/utils/password.util';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;
  let auditLogService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    auditLogService = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLogService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('always excludes SUPER_ADMIN from user listings', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll({});

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            NOT: { role: Role.SUPER_ADMIN },
          }),
        }),
      );
    });

    it('filters by status and role when provided', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll({ role: Role.STUDENT, status: UserStatus.ACTIVE });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: Role.STUDENT,
            status: UserStatus.ACTIVE,
            NOT: { role: Role.SUPER_ADMIN },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('user-none')).rejects.toThrow(NotFoundException);
    });

    it('returns user when found', async () => {
      const mockUser = { id: 'u-1', email: 'user@uemp.test' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('u-1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateStatus', () => {
    it('updates status and logs USER_SUSPEND audit action', async () => {
      const existingUser = { id: 'u-1', status: UserStatus.ACTIVE };
      prisma.user.findUnique.mockResolvedValue(existingUser);
      prisma.user.update.mockResolvedValue({ ...existingUser, status: UserStatus.SUSPENDED });

      const result = await service.updateStatus('u-1', UserStatus.SUSPENDED, 'actor-admin');

      expect(result.status).toBe(UserStatus.SUSPENDED);
      expect(auditLogService.record).toHaveBeenCalledWith({
        userId: 'actor-admin',
        action: AuditAction.USER_SUSPEND,
        entityType: 'User',
        entityId: 'u-1',
        metadata: { previousStatus: UserStatus.ACTIVE, newStatus: UserStatus.SUSPENDED },
      });
    });

    it('updates status and logs USER_ACTIVATE audit action', async () => {
      const existingUser = { id: 'u-1', status: UserStatus.SUSPENDED };
      prisma.user.findUnique.mockResolvedValue(existingUser);
      prisma.user.update.mockResolvedValue({ ...existingUser, status: UserStatus.ACTIVE });

      const result = await service.updateStatus('u-1', UserStatus.ACTIVE, 'actor-admin');

      expect(result.status).toBe(UserStatus.ACTIVE);
      expect(auditLogService.record).toHaveBeenCalledWith({
        userId: 'actor-admin',
        action: AuditAction.USER_ACTIVATE,
        entityType: 'User',
        entityId: 'u-1',
        metadata: { previousStatus: UserStatus.SUSPENDED, newStatus: UserStatus.ACTIVE },
      });
    });
  });

  describe('updateMyProfile', () => {
    it('updates own profile and records PROFILE_UPDATE audit action', async () => {
      prisma.user.update.mockResolvedValue({ id: 'u-1', phone: '08012345678' });

      const result = await service.updateMyProfile('u-1', { phone: '08012345678' });

      expect(result.phone).toBe('08012345678');
      expect(auditLogService.record).toHaveBeenCalledWith({
        userId: 'u-1',
        action: AuditAction.PROFILE_UPDATE,
        entityType: 'User',
        entityId: 'u-1',
      });
    });
  });

  describe('changePassword', () => {
    it('throws UnauthorizedException if current password verification fails', async () => {
      const existingUser = { id: 'u-1', passwordHash: 'hash-abc' };
      prisma.user.findUnique.mockResolvedValue(existingUser);
      jest.spyOn(passwordUtil, 'verifyPassword').mockResolvedValue(false);

      await expect(
        service.changePassword('u-1', {
          currentPassword: 'wrong-pass',
          newPassword: 'new-pass-123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('hashes new password, updates user, and logs PASSWORD_CHANGE audit action', async () => {
      const existingUser = { id: 'u-1', passwordHash: 'old-hash' };
      prisma.user.findUnique.mockResolvedValue(existingUser);
      jest.spyOn(passwordUtil, 'verifyPassword').mockResolvedValue(true);
      jest.spyOn(passwordUtil, 'hashPassword').mockResolvedValue('new-hash');
      prisma.user.update.mockResolvedValue({ id: 'u-1', passwordHash: 'new-hash' });

      const result = await service.changePassword('u-1', {
        currentPassword: 'correct-pass',
        newPassword: 'new-pass-123',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u-1' },
        data: { passwordHash: 'new-hash' },
      });
      expect(auditLogService.record).toHaveBeenCalledWith({
        userId: 'u-1',
        action: AuditAction.PASSWORD_CHANGE,
        entityType: 'User',
        entityId: 'u-1',
      });
      expect(result).toEqual({ success: true });
    });
  });
});
