import { z } from "zod";

export const createLecturerFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  staffId: z.string().min(2, "Staff ID must be at least 2 characters"),
  title: z.string().optional(),
  departmentId: z.string().min(1, "Select a department"),
});

export type CreateLecturerFormValues = z.infer<typeof createLecturerFormSchema>;

export const updateLecturerFormSchema = z.object({
  staffId: z.string().min(2, "Staff ID must be at least 2 characters"),
  title: z.string().optional(),
});

export type UpdateLecturerFormValues = z.infer<typeof updateLecturerFormSchema>;
