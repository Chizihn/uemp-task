import { apiClient, unwrap } from "./client";
import type { Paginated, UserListItem, UserStatus, UserFilters } from "@/lib/types";

export type { UserFilters };

export function listUsers(filters: UserFilters) {
  return unwrap(
    apiClient.get<{ success: true; data: Paginated<UserListItem> }>("/users", {
      params: filters,
    }),
  );
}

export function updateUserStatus(id: string, status: UserStatus) {
  return unwrap(
    apiClient.patch<{ success: true; data: UserListItem }>(`/users/${id}/status`, { status }),
  );
}
