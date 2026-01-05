import { randomBytes, createHash, createCipheriv, createDecipheriv } from 'node:crypto';

// This key should be a 32-byte (256-bit) string stored in your .env file
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
}

/**
 * Encrypts a plain text string
 * Returns: "iv:authTag:encryptedData"
 */
export const encryptSecret = (text: string): string => {
    const iv = randomBytes(12); // GCM standard IV length
    const key = createHash('sha256').update(ENCRYPTION_KEY).digest();

    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // We store all three pieces needed for decryption in one string
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts the combined string back to plain text
 */
export const decryptSecret = (encryptedData: string): string => {
    const [ivHex, authTagHex, encryptedText] = encryptedData.split(':');
    const key = createHash('sha256').update(ENCRYPTION_KEY).digest();

    const decipher = createDecipheriv(
        ALGORITHM,
        key,
        Buffer.from(ivHex, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}