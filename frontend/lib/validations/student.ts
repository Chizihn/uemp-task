import { z } from "zod";

export { LEVELS } from "@/lib/constants";

export const createStudentFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  matricNumber: z.string().min(3, "Matric number must be at least 3 characters"),
  departmentId: z.string().min(1, "Select a department"),
  programId: z.string().min(1, "Select a program"),
  level: z.number().int().min(100).max(700),
});

export type CreateStudentFormValues = z.infer<typeof createStudentFormSchema>;

export const updateStudentFormSchema = z.object({
  matricNumber: z.string().min(3, "Matric number must be at least 3 characters"),
  programId: z.string().min(1, "Select a program"),
  level: z.number().int().min(100).max(700),
});

export type UpdateStudentFormValues = z.infer<typeof updateStudentFormSchema>;
