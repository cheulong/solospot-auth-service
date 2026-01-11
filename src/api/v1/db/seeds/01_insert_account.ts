// seeds/01_insert_places.ts
import { db } from "../index";
import { authTable } from "../schema/auth.schema";

export const authSeed = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    email: "user1@example.com",
    passwordHash: "$argon2id$hashedpassword1",
    emailVerified: true,
    emailVerifiedAt: new Date("2024-01-10T10:00:00Z"),
    role: "user",
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorBackupCodes: null,
    createdAt: new Date("2024-01-10T09:55:00Z"),
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    email: "user2@example.com",
    passwordHash: "$argon2id$hashedpassword2",
    emailVerified: false,
    emailVerifiedAt: null,
    role: "user",
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorBackupCodes: null,
    createdAt: new Date("2024-02-05T14:30:00Z"),
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    email: "admin@example.com",
    passwordHash: "$argon2id$hashedpassword3",
    emailVerified: true,
    emailVerifiedAt: new Date("2024-01-01T08:00:00Z"),
    role: "admin",
    twoFactorEnabled: true,
    twoFactorSecret: "BASE32SECRETADMIN",
    twoFactorBackupCodes: [
      "admin-backup-1",
      "admin-backup-2",
      "admin-backup-3",
    ],
    createdAt: new Date("2023-12-31T23:59:00Z"),
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    email: "security@example.com",
    passwordHash: "$argon2id$hashedpassword4",
    emailVerified: true,
    emailVerifiedAt: new Date("2024-03-01T12:00:00Z"),
    role: "user",
    twoFactorEnabled: true,
    twoFactorSecret: "BASE32SECRETUSER",
    twoFactorBackupCodes: [
      "backup-code-1",
      "backup-code-2",
    ],
    createdAt: new Date("2024-03-01T11:45:00Z"),
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    email: "guest@example.com",
    passwordHash: "$argon2id$hashedpassword5",
    emailVerified: false,
    emailVerifiedAt: null,
    role: "user",
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorBackupCodes: null,
    createdAt: new Date("2024-04-10T16:20:00Z"),
  },
];

export default async function seed() {
  // Remove any existing data
  // await db.delete(authTable);
  
  // Insert all rows in one call
  await db.insert(authTable).values(authSeed);

  // If you want to log what was created:
  console.log(`Inserted ${authSeed.length} rows into ${authTable.email}`);
}

seed()