import type { Role } from "@/lib/types";

export interface DecodedAccessToken {
  sub: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

/**
 * Decodes (never verifies) a JWT payload. Only safe to use for routing
 * re-verifying the signature on every request. See docs/03-rbac-security.md.
 */
export function decodeJwtPayload(token: string): DecodedAccessToken | null {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    return JSON.parse(base64UrlDecode(segment)) as DecodedAccessToken;
  } catch {
    return null;
  }
}

export function isExpired(payload: DecodedAccessToken): boolean {
  return payload.exp * 1000 < Date.now();
}
