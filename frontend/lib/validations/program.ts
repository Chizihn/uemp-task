import { z } from "zod";

export const programFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters"),
  departmentId: z.string().min(1, "Select a department"),
  durationYears: z.number().int().min(1).max(7),
  maxLevel: z.number().int().min(100).max(700),
});

export type ProgramFormValues = z.infer<typeof programFormSchema>;
