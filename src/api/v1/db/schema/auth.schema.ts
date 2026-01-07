import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import z, { object, string } from "zod";
import escapeHtml from 'escape-html';

/**
 * @openapi
 * components:
 *   schemas:
 *     Place:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         createdAt:
 *           type: string
 *     PlaceList:
 *       type: array
 *       items:
 *         $ref: "#/components/schemas/Place"
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

