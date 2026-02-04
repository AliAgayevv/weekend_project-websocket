import { z } from "zod";

export const listCommentaryQuerySchema = z.object({
  limit: z.coerce
    .number()
    .positive("Limit must be a positive integer")
    .int("Limit must be an integer")
    .max(100, "Limit cannot exceed 100")
    .optional(),
});

export const createCommentarySchema = z.object({
  minute: z.coerce
    .number()
    .int("Minute must be an integer")
    .nonnegative("Minute cannot be negative"),
  sequence: z.coerce
    .number()
    .int("Sequence must be an integer")
    .nonnegative("Sequence cannot be negative"),
  period: z.string().min(1, "Period is required"),
  eventType: z.string().min(1, "Event type is required"),
  actor: z.string().min(1, "Actor is required"),
  team: z.string().min(1, "Team is required"),
  message: z.string().min(1, "Message is required"),
  metadata: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string()).default([]),
});

export type ListCommentaryQuery = z.infer<typeof listCommentaryQuerySchema>;
export type CreateCommentary = z.infer<typeof createCommentarySchema>;
