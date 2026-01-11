import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * @openapi
 * components:
 *   schemas:
 *     Account:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         passwordHash:
 *           type: string
 *         emailVerifiedAt:
 *           type: string
 *         emailVerified:
 *           type: boolean
 *         createdAt:
 *           type: string
 *         role:
 *           type: string
 *         twoFactorSecret:
 *           type: string
 *         twoFactorEnabled:
 *           type: boolean
 *         twoFactorBackupCodes:
 *           type: array
 *           items:
 *             type: string
 *     AccountList:
 *       type: array
 *       items:
 *         $ref: "#/components/schemas/Account"
 */
export const authTable = pgTable("auth", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  emailVerifiedAt: timestamp("email_verified_at"),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  role: varchar("role", { length: 50 }).default("user").notNull(),

  // 2FA Fields
  twoFactorSecret: varchar("two_factor_secret", { length: 255 }),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorBackupCodes: text("two_factor_backup_codes").array(), // JSON array of backup codes
});

/**
 * @openapi
 * components:
 *   schemas:
 *     RefreshToken:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         accountId:
 *           type: string
 *         tokenHash:
 *           type: string
 *         expiresAt:
 *           type: string
 *         revokedAt:
 *           type: string
 *         createdAt:
 *           type: string
 *     RefreshTokenList:
 *       type: array
 *       items:
 *         $ref: "#/components/schemas/RefreshToken"
 */
export const refreshTokenTable = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => authTable.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 500 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_refresh_token_user_id").on(table.accountId),
  index("idx_refresh_token_hash").on(table.tokenHash),
]);

/**
 * @openapi
 * components:
 *   schemas:
 *     Verification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         accountId:
 *           type: string
 *         otp:
 *           type: string
 *         identifier:
 *           type: string
 *         reason:
 *           type: string
 *         expiresAt:
 *           type: string
 *         createdAt:
 *           type: string
 *         attempts:
 *           type: integer
 *     VerificationList:
 *       type: array
 *       items:
 *         $ref: "#/components/schemas/Verification"
 */
export const verificationTable = pgTable("verification", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => authTable.id, { onDelete: "cascade" }),
  otp: varchar("otp", { length: 500 }).notNull(),
  identifier: varchar("identifier", { length: 100 }).default("email").notNull(),
  reason: varchar("reason", { length: 100 }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  attempts: integer("attempts").default(0),
});

