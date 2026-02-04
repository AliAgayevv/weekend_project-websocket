import { z } from "zod";

export const MATCH_STATUS = {
  SCHEDULED: "scheduled",
  LIVE: "live",
  FINISHED: "finished",
} as const;

export const listMatchesQuerySchema = z.object({
  limit: z.coerce
    .number()
    .positive("Limit must be a positive integer")
    .int("Limit must be an integer")
    .max(100, "Limit cannot exceed 100")
    .optional(),
});

export const matchIdParamSchema = z.object({
  id: z.coerce
    .number()
    .positive("ID must be a positive integer")
    .int("ID must be an integer"),
});

export const createMatchSchema = z
  .object({
    sport: z.string().min(1, "Sport is required"),
    homeTeam: z.string().min(1, "Home team is required"),
    awayTeam: z.string().min(1, "Away team is required"),
    startTime: z
      .string()
      .min(1, "Start time is required")
      .refine(
        (val) => {
          const date = new Date(val);
          return !isNaN(date.getTime()) && date.toISOString() === val;
        },
        { message: "Start time must be a valid ISO date string" },
      ),
    endTime: z
      .string()
      .min(1, "End time is required")
      .refine(
        (val) => {
          const date = new Date(val);
          return !isNaN(date.getTime()) && date.toISOString() === val;
        },
        { message: "End time must be a valid ISO date string" },
      ),
    homeScore: z.coerce
      .number()
      .int("Home score must be an integer")
      .nonnegative("Home score cannot be negative")
      .optional(),
    awayScore: z.coerce
      .number()
      .int("Away score must be an integer")
      .nonnegative("Away score cannot be negative")
      .optional(),
  })
  .superRefine((data, ctx) => {
    const startDate = new Date(data.startTime);
    const endDate = new Date(data.endTime);

    if (endDate <= startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after start time",
        path: ["endTime"],
      });
    }
  });

export const updateScoreSchema = z.object({
  homeScore: z.coerce
    .number()
    .int("Home score must be an integer")
    .nonnegative("Home score cannot be negative"),
  awayScore: z.coerce
    .number()
    .int("Away score must be an integer")
    .nonnegative("Away score cannot be negative"),
});

export type ListMatchesQuery = z.infer<typeof listMatchesQuerySchema>;
export type MatchIdParam = z.infer<typeof matchIdParamSchema>;
export type CreateMatch = z.infer<typeof createMatchSchema>;
export type UpdateScore = z.infer<typeof updateScoreSchema>;
