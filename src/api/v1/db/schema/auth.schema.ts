import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import z, { object, string } from "zod";

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
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  attempts: integer("attempts").default(0),
});

/**
 * @openapi
 * components:
 *   schemas:
 *     CreatePlaceInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the place
 *           default: "Central Park"
 *     CreatePlaceResponse:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         id:
 *           type: string
 *         createdAt:
 *           type: string
 */
export const createUserSchema = object({
  body: object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    firstName: z.string({
      error: "First name is required",
    }).min(1, "First name is required"),
    lastName: z.string({
      error: "Last name is required",
    }).min(1, "Last name is required")
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;