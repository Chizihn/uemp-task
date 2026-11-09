import { z } from "zod";

export const departmentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters"),
  facultyId: z.string().min(1, "Select a faculty"),
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;
