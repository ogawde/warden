import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { loadEnv } from "./load-env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const VERSION_PREFIX = "v1";

function getEncryptionKey(): Buffer {
  loadEnv();

  const raw = process.env.TOKEN_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error("TOKEN_ENCRYPTION_KEY is not set");
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY must decode to ${KEY_LENGTH} bytes (256 bits); got ${key.length} bytes`
    );
  }

  return key;
}

/**
 * Encrypted token wire format:
 *   v1:<base64(iv)>:<base64(ciphertext)>:<base64(authTag)>
 *
 * - iv: 12-byte GCM nonce
 * - ciphertext: AES-256-GCM encrypted UTF-8 plaintext
 * - authTag: 16-byte GCM authentication tag
 */
export function encryptToken(plainText: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  return [
    VERSION_PREFIX,
    iv.toString("base64"),
    ciphertext.toString("base64"),
    authTag.toString("base64")
  ].join(":");
}

export function decryptToken(cipherText: string): string {
  const key = getEncryptionKey();

  const parts = cipherText.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION_PREFIX) {
    throw new Error("Encrypted token is invalid or unsupported");
  }

  const [, ivBase64, encryptedBase64, authTagBase64] = parts;

  let iv: Buffer;
  let encrypted: Buffer;
  let authTag: Buffer;

  try {
    iv = Buffer.from(ivBase64, "base64");
    encrypted = Buffer.from(encryptedBase64, "base64");
    authTag = Buffer.from(authTagBase64, "base64");
  } catch {
    throw new Error("Encrypted token is malformed");
  }

  if (iv.length !== IV_LENGTH) {
    throw new Error("Encrypted token is invalid or unsupported");
  }

  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]).toString("utf8");
  } catch {
    throw new Error("Encrypted token could not be decrypted");
  }
}
