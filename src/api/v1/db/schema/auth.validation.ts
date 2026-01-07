import z, { object } from "zod";
import escapeHtml from 'escape-html';

/**
 * Shared helpers
 */
const sanitizedString = (fieldName: string) =>
  z
    .string({ error: `${fieldName} is required` })
    .min(1, `${fieldName} is required`)
    .transform((val) => escapeHtml(val.trim()));

const emailSchema = z
  .string({ error: "Email is required" })
  .email("Invalid email address")
  .trim()
  .toLowerCase();

/**
 * Create user
 */

export const createUserSchema = object({
  body: object({
    email: emailSchema,
    password: z.string({ error: "Password is required" }).min(6, "Password must be at least 6 characters long"),
    firstName: sanitizedString("First name"),
    lastName: sanitizedString("Last name"),
  }),
});

/**
 * Recovery login
 */

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
export const recoveryLoginSchema = object({
  body: object({
    email: emailSchema,
    recoveryCode: z.string({
      error: "Recovery code is required",
    }).min(6, "Recovery code must be at least 6 characters long"),
  }),
});

/**
 * Types
 */
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type RecoveryLoginInput = z.infer<typeof recoveryLoginSchema>;




