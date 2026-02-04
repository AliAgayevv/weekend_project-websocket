import { Request, Response, Router } from "express";
import { matchIdParamSchema } from "../validation/matches";
import {
  createCommentarySchema,
  listCommentaryQuerySchema,
} from "../validation/commentary";
import { commentary } from "../db/schema";
import { db } from "../config/db";
import { desc, eq } from "drizzle-orm";

const router = Router({ mergeParams: true });
const MAX_LIMIT = 100;
router.get("/:id/commentary", async (req: Request, res: Response) => {
  const paramsParsed = matchIdParamSchema.safeParse(req.params);

  if (!paramsParsed.success) {
    return res.status(400).json({
      error: "Invalid match ID parameter",
      details: paramsParsed.error.issues,
    });
  }

  const queryParsed = listCommentaryQuerySchema.safeParse(req.query);

  if (!queryParsed.success) {
    return res.status(400).json({
      error: "Invalid query parameters",
      details: queryParsed.error.issues,
    });
  }

  const limit = Number(Math.min(queryParsed.data.limit ?? 100, MAX_LIMIT));

  try {
    const data = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, paramsParsed.data.id))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    res.json({ data });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch commentary",
      details: JSON.stringify(error),
    });
  }
});
router.post("/:id/commentary", async (req: Request, res: Response) => {
  console.log(req.params);
  const paramsParsed = matchIdParamSchema.safeParse(req.params);

  if (!paramsParsed.success) {
    return res.status(400).json({
      error: "Invalid match ID parameter",
      details: paramsParsed.error.issues,
    });
  }

  const bodyParsed = createCommentarySchema.safeParse(req.body);

  if (!bodyParsed.success) {
    return res.status(400).json({
      error: "Invalid payload",
      details: bodyParsed.error.issues,
    });
  }

  try {
    const { minute, ...rest } = bodyParsed.data;
    const [result] = await db
      .insert(commentary)
      .values({
        matchId: paramsParsed.data.id,
        minute: minute,
        ...rest,
      })
      .returning();

    if (req.app.locals.broadcastCommentary) {
      req.app.locals.broadcastCommentary(result.matchId, result);
    }

    res.status(201).json({ data: result });
  } catch (error) {
    console.error("Failed to create commentray", error);
    res.status(500).json({
      error: "Failed to create commentary",
    });
  }
});

export default router;
