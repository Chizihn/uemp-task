import { z } from "zod";

export const facultyFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters"),
});

export type FacultyFormValues = z.infer<typeof facultyFormSchema>;
