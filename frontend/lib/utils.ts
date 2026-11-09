export { cn } from "cn"

interface NameParts {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}

export function formatName({ firstName, middleName, lastName }: NameParts): string {
  return [firstName, middleName, lastName].filter(Boolean).join(" ");
}

export function initialsFromName({ firstName, lastName }: NameParts): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

/** Lecturer rows may omit the nested `user` projection — fall back to the staff ID. */
export function lecturerDisplayName(lecturer: { staffId: string; user?: NameParts | null }): string {
  return lecturer.user ? formatName(lecturer.user) : lecturer.staffId;
}
