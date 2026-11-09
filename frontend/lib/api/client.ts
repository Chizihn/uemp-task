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

const NO_REFRESH_PATHS = ["/auth/login", "/auth/refresh", "/auth/logout"];

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
        if (typeof window !== "undefined") {
          // Hard reload, not router.push: this runs outside React (an axios
          // interceptor), and the refresh token itself just failed, so a
          // full reload is what actually guarantees every bit of client
          // state (React Query cache included) gets wiped.
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
