import { createAuthRepository } from "./auth.repository";
import { createRefreshTokenRepository } from "./refreshToken.repository";
import { createVerificationRepository } from "./verification.repository";

type DB = any;

export const createRepositories = (db: DB) => ({
  authRepo: createAuthRepository(db),
  refreshTokenRepo: createRefreshTokenRepository(db),
  verificationRepo: createVerificationRepository(db),
});

export type RepositoryType = ReturnType<typeof createRepositories>;