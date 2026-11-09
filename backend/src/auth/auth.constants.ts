import { CookieOptions } from 'express';

export const ACCESS_TOKEN_COOKIE = 'uemp_access_token';
export const REFRESH_TOKEN_COOKIE = 'uemp_refresh_token';

export function buildCookieOptions(maxAgeMs: number): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/',
    maxAge: maxAgeMs,
  };
}

export const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
