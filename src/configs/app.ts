import "dotenv/config";
import express, { Express } from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { createAuthRouter } from "../api/v1/routes/auth.route";
import { createAuthService } from "../api/v1/services/auth.service";
import { errorHandler } from "../api/v1/middleware/error.middleware";
import { notFound } from "../api/v1/middleware/notFound.middleware";
import { setCache } from "../api/v1/middleware/cache.middleware";
import { authLimiter, otpLimiter } from "../api/v1/middleware/rateLimiter.middleware";
import swaggerDocs from "../utils/swagger";
import { HTTP_STATUS } from "../constants/httpStatus";

export default function (db: any, port: number): Express {
  const app = express();

  app.use(cookieParser());
  app.use(helmet());
  app.use(cors({ origin: "*" }));
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(setCache);

  /**
   * @openapi
   * /health:
   *   get:
   *     tags:
   *       - Health
   *     summary: Check if the server is healthy
   *     responses:
   *       200:
   *         description: Server is healthy
   */
  app.get("/health", (_req, res) => {
    res.status(HTTP_STATUS.OK).send("Auth server is healthy.");
  });

  const authService = createAuthService(db);

  app.use("/auth/v1/send-verification", otpLimiter);

  app.use("/auth/v1", authLimiter, createAuthRouter({ authService }));

  swaggerDocs(app, port);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
