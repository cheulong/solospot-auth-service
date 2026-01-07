import argon2 from 'argon2';

export async function hashString(password: string): Promise<string> {
    return await argon2.hash(password);
}

export async function verifyString(password: string, hash: string): Promise<boolean> {
  return await argon2.verify(hash, password);
}
