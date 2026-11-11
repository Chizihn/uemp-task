import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { API_URL } from "@/lib/env";

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // the backend's httpOnly cookies ride along automatically
  headers: { "Content-Type": "application/json" },
});

/** Every list/mutation response is wrapped as `{ success, data }`; errors as `{ success: false, message }`. */
export interface ApiEnvelope<T> {
  success: true;
  data: T;
}

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

const NO_REFRESH_PATHS = ["/auth/login", "/auth/refresh", "/auth/logout", "/auth/clear-session"];

let refreshPromise: Promise<void> | null = null;

function isAuthEndpoint(url?: string): boolean {
  return !!url && NO_REFRESH_PATHS.some((p) => url.includes(p));
}

async function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;

    if (
      error.response?.status === 401 &&
      config &&
      !config._retried &&
      !isAuthEndpoint(config.url)
    ) {
      config._retried = true;
      try {
        await refreshSession();
        return apiClient(config);
      } catch {
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          // The refresh token is dead (expired, or — e.g. after a DB reset —
          // referring to an account that no longer exists) but the cookie can
          // still look "unexpired" to middleware's claim-only check. httpOnly
          // cookies can only be cleared by a Set-Cookie response, so without
          // this call nothing ever clears it and middleware keeps treating
          // /login as "already authenticated," bouncing back to /dashboard
          // forever. This endpoint works with no valid session, unlike /logout.
          try {
            await apiClient.post("/auth/clear-session");
          } catch {
            // Best-effort — still redirect even if this itself fails.
          }
          // Hard reload, not router.push: this runs outside React (an axios
          // interceptor), and the refresh token itself just failed, so a
          // full reload is what actually guarantees every bit of client
          // state (React Query cache included) gets wiped.
          //
          // Guarded to skip while already on /login: an unauthenticated visitor
          // landing there also triggers a `/auth/me` 401 -> failed refresh, and
          // without this check that reloads /login, which repeats the same
          // 401 -> failed refresh -> reload cycle forever.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

/** Unwraps the `{ success, data }` envelope so callers just get `T`. */
export async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const response = await promise;
  return response.data.data;
}

export interface ApiErrorBody {
  success: false;
  statusCode: number;
  message: string | string[];
  path: string;
  timestamp: string;
}

/** Pulls a human-readable message out of our backend's error envelope. */
export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.message) {
      return Array.isArray(body.message) ? body.message.join(", ") : body.message;
    }
  }
  return fallback;
}
