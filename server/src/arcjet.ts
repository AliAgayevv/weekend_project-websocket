import { NextFunction, Request, Response } from "express";
import { envConfig } from "./config/env";
import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";

const arcjetKey = envConfig.ARCJET_KEY;
const arcjetMode = envConfig.ARCJET_MODE;

if (!arcjetKey) {
  throw new Error("ARCJET_KEY is not set in .env file");
}

export const httpArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({ mode: arcjetMode }),
        detectBot({
          mode: arcjetMode,
          allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
        }),
        // Per ip address rate limiter allowing 50 requests per 10 seconds
        slidingWindow({ mode: arcjetMode, interval: "10s", max: 50 }),
      ],
    })
  : null;

export const wsArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({ mode: arcjetMode }),
        detectBot({
          mode: arcjetMode,
          allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
        }),

        slidingWindow({ mode: arcjetMode, interval: "2s", max: 5 }),
      ],
    })
  : null;

export function securityMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!httpArcjet) return next();

    try {
      const decision = await httpArcjet.protect(req);

      if (decision.isDenied()) {
        if (decision.reason.isRateLimit())
          return res.status(429).json({ error: "Too Many Requests" });

        return res.status(403).json({ error: "Forbidden" });
      }
    } catch (error) {
      console.error(`Arcjet middleware error: `, error);
      res.status(503).json({ error: "Service Unavailable" });
    }
    next();
  };
}
