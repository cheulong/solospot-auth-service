import argon2 from 'argon2';
import { createHash } from 'node:crypto';

export async function hashString(password: string): Promise<string> {
  return await argon2.hash(password);
}

export async function verifyString(password: string, hash: string): Promise<boolean> {
  return await argon2.verify(hash, password);
}

export async function tokenHash(token: string): Promise<string> {
  return createHash('sha256')
    .update(token)
    .digest('hex');
}