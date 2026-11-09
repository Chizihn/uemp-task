import { CookieOptions } from 'express';

export const ACCESS_TOKEN_COOKIE = 'uemp_access_token';
export const REFRESH_TOKEN_COOKIE = 'uemp_refresh_token';

/**
 * httpOnly + secure(in prod) + sameSite=lax cookies: the token is never
 * readable by client JS, closing the XSS token-theft vector that a
 * localStorage/js-cookie approach leaves open.
 */
export function buildCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/',
    maxAge: maxAgeMs,
  };
}

export const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
