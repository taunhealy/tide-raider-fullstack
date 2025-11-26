import crypto from "crypto";

/**
 * AES-256-GCM encryption for sensitive data (PayPal credentials)
 * Uses environment variable ENCRYPTION_KEY
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable not set");
  }
  return Buffer.from(key, "hex");
}

/**
 * Encrypt data using AES-256-GCM
 * @param plaintext - Data to encrypt
 * @returns Encrypted string in format: iv:authTag:salt:ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error("Cannot encrypt empty string");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Return in format: iv:authTag:salt:ciphertext
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${salt.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt data encrypted with AES-256-GCM
 * @param encryptedData - Encrypted string in format: iv:authTag:salt:ciphertext
 * @returns Decrypted plaintext
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error("Cannot decrypt empty string");
  }

  const key = getEncryptionKey();
  const parts = encryptedData.split(":");

  if (parts.length !== 4) {
    throw new Error("Invalid encrypted data format");
  }

  const [ivHex, authTagHex, _saltHex, ciphertext] = parts;

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Hash a string using SHA-256 (for non-reversible hashing)
 */
export function hash(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Generate a random encryption key (for setup)
 * Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

