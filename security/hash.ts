import argon2 from 'argon2';

export async function hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await argon2.verify(hash, password);
}

// Test the functions
async function test() {
  const password = "test123";
  const hash = await hashPassword(password);
  console.log("Hash:", hash);
  
  const isValid = await verifyPassword(password, hash);
  console.log("Password valid:", isValid);
}

test().catch(console.error);
