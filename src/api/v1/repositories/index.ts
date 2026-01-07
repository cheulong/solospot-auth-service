import { createAuthRepository } from "./auth.repository";
import { createRefreshTokenRepository } from "./refresh-token.repository";
import { createVerificationRepository } from "./verification.repository";

type DB = any;

export const createRepositories = (db: DB) => ({
  auth: createAuthRepository(db),
  refreshToken: createRefreshTokenRepository(db),
  verification: createVerificationRepository(db),
});
