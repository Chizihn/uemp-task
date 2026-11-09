import { z } from "zod";

export const sessionFormSchema = z.object({
  name: z.string().regex(/^\d{4}\/\d{4}$/, 'Must look like "2024/2025"'),
});

export type SessionFormValues = z.infer<typeof sessionFormSchema>;
