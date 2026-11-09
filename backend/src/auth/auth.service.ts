import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/audit-action.constants';
import { JwtPayload } from './types/jwt-payload.interface';
import { AuthUser } from '../common/types/auth-user.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async validateCredentials(email: string, password: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('This account is not active. Contact your administrator.');
    }

    const passwordMatches = await argon2.verify(user.passwordHash, password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return { id: user.id, email: user.email, role: user.role };
  }

  async issueTokens(user: AuthUser) {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as JwtSignOptions['expiresIn'],
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as JwtSignOptions['expiresIn'],
    });

    return { accessToken, refreshToken };
  }

  async login(user: AuthUser) {
    await this.auditLogService.record({
      userId: user.id,
      action: AuditAction.LOGIN,
      entityType: 'User',
      entityId: user.id,
    });
    return this.issueTokens(user);
  }

  async logout(userId: string) {
    await this.auditLogService.record({
      userId,
      action: AuditAction.LOGOUT,
      entityType: 'User',
      entityId: userId,
    });
  }

  /** Verifies a refresh token and re-checks the account is still active before rotating it. */
  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is inactive or no longer exists');
    }

    return this.issueTokens({ id: user.id, email: user.email, role: user.role });
  }

  async getProfile(authUser: AuthUser) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        student: { include: { department: { include: { faculty: true } }, program: true } },
        lecturer: { include: { department: { include: { faculty: true } } } },
        deptAdminProfile: { include: { department: { include: { faculty: true } } } },
      },
    });
    return user;
  }
}
