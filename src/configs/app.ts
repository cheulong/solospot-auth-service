import "dotenv/config";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import { createAuthRouter } from "../api/v1/routes/auth.route";
// import { createPlacesRouter } from "./api/v1/routes/places.route";
import { errorHandler } from "../api/v1/middleware/error.middleware";
import { notFound } from "../api/v1/middleware/notFound.middleware";
import { createAuthService } from "../api/v1/services/auth.service";
import { setCache } from "../api/v1/middleware/cache.middleware";
import swaggerDocs from "../utils/swagger";



export default function (db: any, port: number) {
  const app = express();
  app.use(setCache);
  app.use(express.json());
  app.use(morgan("dev"));
  app.use(helmet());
  app.use(
    cors({
      origin: "*",
    })
  );

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
  app.get("/health", (req, res) => {
    res.status(200).send("Place server is healthy.");
  });

  const authService = createAuthService(db);

  app.use("/auth/v1", createAuthRouter({ authService }));

  swaggerDocs(app, port);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
