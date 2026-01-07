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
 * @openapi
 * components:
 *   schemas:
 *     CreateUserInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *       properties:
 *         email:
 *           type: string
 *           description: The email address
 *         password:
 *           type: string
 *           description: The password
 *         firstName:
 *           type: string
 *           description: The first name
 *         lastName:
 *           type: string
 *           description: The last name
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
 * @openapi
 * components:
 *   schemas:
 *     LoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           description: The email address
 *         password:
 *           type: string
 *           description: The password
 */
export const loginSchema = object({
    body: object({
        email: emailSchema,
        password: z.string({ error: "Password is required" }).min(6, "Password must be at least 6 characters long"),
    })
})

/**
 * @openapi
 * components:
 *   schemas:
 *     ChangePasswordInput:
 *       type: object
 *       required:
 *         - oldPassword
 *         - newPassword
 *       properties:
 *         oldPassword:
 *           type: string
 *         newPassword:
 *           type: string
 */
export const changePasswordSchema = object({
    body: object({
        oldPassword: z.string({ error: "Old password is required" }).min(6, "Old password must be at least 6 characters long"),
        newPassword: z.string({ error: "New password is required" }).min(6, "New password must be at least 6 characters long"),
    })
})

/**
 * @openapi
 * components:
 *   schemas:
 *     ForgotPasswordInput:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           description: The email address
 */
export const forgotPasswordSchema = object({
    body: object({
        email: emailSchema,
    })
})

/**
 * @openapi
 * components:
 *   schemas:
 *     LoginPasswordlessInput:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           description: The email address
 */
export const loginPasswordlessSchema = object({
    body: object({
        email: emailSchema,
    })
})

/**
 * @openapi
 * components:
 *   schemas:
 *     ResetPasswordInput:
 *       type: object
 *       required:
 *         - accountId
 *         - otp
 *         - newPassword
 *       properties:
 *         accountId:
 *           type: string
 *         otp:
 *           type: string
 *         newPassword:
 *           type: string
 */

export const resetPasswordSchema = object({
    body: object({
        accountId: z.string({ error: "Account ID is required" }),
        otp: z.string({ error: "OTP is required" }).min(6, "OTP must be at least 6 characters long"),
        newPassword: z.string({ error: "New password is required" }).min(6, "New password must be at least 6 characters long"),
    })
})

/**
 * @openapi
 * components:
 *   schemas:
 *     RecoveryLoginInput:
 *       type: object
 *       required:
 *         - email
 *         - recoveryCode
 *       properties:
 *         email:
 *           type: string
 *           description: The email address
 *         recoveryCode:
 *           type: string
 *           description: The recovery code
 *     RecoveryLoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         accessToken:
 *           type: string
 *         refreshToken:
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




