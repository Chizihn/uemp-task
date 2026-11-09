import { z } from "zod";

export const deptAdminFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  departmentId: z.string().min(1, "Select a department"),
});

export type DeptAdminFormValues = z.infer<typeof deptAdminFormSchema>;
