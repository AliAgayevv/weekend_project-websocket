import { Request, Response, Router } from "express";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "../validation/matches";
import { matches } from "../db/schema";
import { db } from "../config/db";
import { getMatchStatus } from "../utils/match-status";
import { desc } from "drizzle-orm";

const router = Router();
const MAX_LIMIT = 100;
router.get("/", async (req: Request, res: Response) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      error: `Invalid query parameters.`,
      details: JSON.stringify(parsed.error),
    });
  }

  const limit = Number(Math.min(parsed.data.limit ?? 50, MAX_LIMIT));

  try {
    const data = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(limit);

    res.json({ data });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch matches",
      details: JSON.stringify(error),
    });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const parsed = createMatchSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: `Invalid payload.`,
      details: JSON.stringify(parsed.error),
    });
  }
  const {
    data: { startTime, endTime, homeScore, awayScore },
  } = parsed;

  try {
    const [event] = await db
      .insert(matches)
      .values({
        ...parsed.data,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: getMatchStatus(startTime, endTime) || "scheduled",
      })
      .returning();

    res.status(201).json({ data: event });
  } catch (error) {
    res.status(500).json({
      error: "Failed to create match",
      details: JSON.stringify(error),
    });
  }
});

export default router;
