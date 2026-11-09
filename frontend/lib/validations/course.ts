import { z } from "zod";
import { TERMS } from "@/lib/constants";

export const createCourseFormSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters"),
  title: z.string().min(2, "Title must be at least 2 characters"),
  units: z.number().int().min(1).max(6),
  level: z.number().int().min(100).max(700),
  term: z.enum(TERMS),
  departmentId: z.string().min(1, "Select a department"),
});

export type CreateCourseFormValues = z.infer<typeof createCourseFormSchema>;

export const updateCourseFormSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters"),
  title: z.string().min(2, "Title must be at least 2 characters"),
  units: z.number().int().min(1).max(6),
  level: z.number().int().min(100).max(700),
  term: z.enum(TERMS),
});

export type UpdateCourseFormValues = z.infer<typeof updateCourseFormSchema>;
