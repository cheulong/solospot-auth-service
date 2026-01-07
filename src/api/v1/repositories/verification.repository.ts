import { eq } from "drizzle-orm";
import { verificationTable } from "../db/schema/auth.schema";

type DB = any;

export const createVerificationRepository = (db: DB) => {
  const upsert = async (
    accountId: string,
    identifier: string,
    otp: string,
    expiresAt: Date,
    attempts: number,
    reason: string
  ) => {
    const existing = await db.select().from(verificationTable).where(eq(verificationTable.accountId, accountId));

    if (existing.length > 0) {
      const [updated] = await db.update(verificationTable)
        .set({ otp, identifier, accountId, expiresAt, attempts, reason })
        .where(eq(verificationTable.accountId, accountId))
        .returning();
      return updated;
    } else {
      const [inserted] = await db.insert(verificationTable)
        .values({ otp, identifier, accountId, expiresAt, attempts, reason })
        .returning();
      return inserted;
    }
  };

  return {
    updateOtp: upsert,

    getOtp: async (accountId: string) => {
      const [otp] = await db.select().from(verificationTable).where(eq(verificationTable.accountId, accountId));
      return otp;
    },

    getOtpByEmail: async (email: string) => {
      const [otp] = await db.select().from(verificationTable).where(eq(verificationTable.identifier, email));
      return otp;
    },

    deleteOtp: async (accountId: string) => {
      await db.delete(verificationTable).where(eq(verificationTable.accountId, accountId));
    },
  };
};
