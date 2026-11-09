import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { AuditAction } from '../../audit-log/audit-action.constants';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
    };
  };
  let jwtService: {
    signAsync: jest.Mock;
    verifyAsync: jest.Mock;
  };
  let auditLogService: {
    record: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };

    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    auditLogService = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: AuditLogService, useValue: auditLogService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateCredentials', () => {
    it('returns the authenticated user payload on valid email and password', async () => {
      const password = 'Password123!';
      const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

      prisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'student@uemp.test',
        passwordHash,
        status: UserStatus.ACTIVE,
        role: Role.STUDENT,
      });

      const user = await service.validateCredentials('student@uemp.test', password);
      expect(user).toEqual({
        id: 'u-1',
        email: 'student@uemp.test',
        role: Role.STUDENT,
      });
    });

    it('throws UnauthorizedException if user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.validateCredentials('unknown@uemp.test', 'Password123!')).rejects.toThrow(
        new UnauthorizedException('Invalid email or password'),
      );
    });

    it('throws UnauthorizedException if account is suspended or inactive', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'suspended@uemp.test',
        passwordHash: 'hash',
        status: UserStatus.SUSPENDED,
        role: Role.STUDENT,
      });

      await expect(service.validateCredentials('suspended@uemp.test', 'Password123!')).rejects.toThrow(
        new UnauthorizedException('This account is not active. Contact your administrator.'),
      );
    });

    it('throws UnauthorizedException if password does not match', async () => {
      const passwordHash = await argon2.hash('CorrectPassword!', { type: argon2.argon2id });
      prisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'student@uemp.test',
        passwordHash,
        status: UserStatus.ACTIVE,
        role: Role.STUDENT,
      });

      await expect(service.validateCredentials('student@uemp.test', 'WrongPassword!')).rejects.toThrow(
        new UnauthorizedException('Invalid email or password'),
      );
    });
  });

  describe('login & logout', () => {
    it('records login audit event and issues access and refresh tokens', async () => {
      jwtService.signAsync
        .mockResolvedValueOnce('access-token-xyz')
        .mockResolvedValueOnce('refresh-token-xyz');

      const user = { id: 'u-1', email: 'lecturer@uemp.test', role: Role.LECTURER };
      const tokens = await service.login(user);

      expect(auditLogService.record).toHaveBeenCalledWith({
        userId: 'u-1',
        action: AuditAction.LOGIN,
        entityType: 'User',
        entityId: 'u-1',
      });
      expect(tokens).toEqual({
        accessToken: 'access-token-xyz',
        refreshToken: 'refresh-token-xyz',
      });
    });

    it('records logout audit event', async () => {
      await service.logout('u-1');
      expect(auditLogService.record).toHaveBeenCalledWith({
        userId: 'u-1',
        action: AuditAction.LOGOUT,
        entityType: 'User',
        entityId: 'u-1',
      });
    });
  });

  describe('refresh', () => {
    it('throws UnauthorizedException if refresh token is missing', async () => {
      await expect(service.refresh(undefined)).rejects.toThrow(
        new UnauthorizedException('No refresh token provided'),
      );
    });

    it('re-verifies active user and rotates tokens', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'u-1',
        email: 'student@uemp.test',
        role: Role.STUDENT,
      });

      prisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'student@uemp.test',
        status: UserStatus.ACTIVE,
        role: Role.STUDENT,
      });

      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const tokens = await service.refresh('old-refresh-token');

      expect(tokens).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });
  });
});
