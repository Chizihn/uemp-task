import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE_MS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE_MS,
  buildCookieOptions,
} from './auth.constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateCredentials(dto.email, dto.password);
    const { accessToken, refreshToken } = await this.authService.login(user);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    const refreshToken = cookies?.[REFRESH_TOKEN_COOKIE];
    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refresh(refreshToken);
    this.setAuthCookies(res, accessToken, newRefreshToken);
    return { success: true };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(user.id);
    res.clearCookie(ACCESS_TOKEN_COOKIE, buildCookieOptions(0));
    res.clearCookie(REFRESH_TOKEN_COOKIE, buildCookieOptions(0));
    return { success: true };
  }

  // Unlike /logout, this doesn't require a valid session — it exists for the one
  // case where the normal logout can't run at all: a cookie that still looks
  // unexpired to the client but no longer verifies (e.g. the account behind it
  // was deleted, or the DB was reset). httpOnly cookies can only be cleared by a
  // Set-Cookie response, so without this, a client stuck in that state has no way
  // to ever clear it and ends up bouncing between /login and /dashboard forever.
  @Public()
  @Post('clear-session')
  @HttpCode(HttpStatus.OK)
  clearSession(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ACCESS_TOKEN_COOKIE, buildCookieOptions(0));
    res.clearCookie(REFRESH_TOKEN_COOKIE, buildCookieOptions(0));
    return { success: true };
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.authService.getProfile(user);
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, buildCookieOptions(ACCESS_TOKEN_MAX_AGE_MS));
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, buildCookieOptions(REFRESH_TOKEN_MAX_AGE_MS));
  }
}
