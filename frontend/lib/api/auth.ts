import { apiClient, unwrap } from "./client";
import type {
  CurrentUser,
  LoginInput,
  LoginResult,
  UpdateMyProfileInput,
  ChangePasswordInput,
} from "@/lib/types";

export type { LoginInput, LoginResult, UpdateMyProfileInput, ChangePasswordInput };

export function login(input: LoginInput) {
  return unwrap(apiClient.post<{ success: true; data: LoginResult }>("/auth/login", input));
}

export function logout() {
  return unwrap(apiClient.post<{ success: true; data: { success: true } }>("/auth/logout"));
}

export function getMe() {
  return unwrap(apiClient.get<{ success: true; data: CurrentUser }>("/auth/me"));
}

export function updateMyProfile(input: UpdateMyProfileInput) {
  return unwrap(
    apiClient.patch<{ success: true; data: CurrentUser }>("/users/me/profile", input),
  );
}

export function changePassword(input: ChangePasswordInput) {
  return unwrap(
    apiClient.patch<{ success: true; data: { success: true } }>("/users/me/password", input),
  );
}
