import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

/**
 * Symmetric encryption for secrets at rest (user-provided AI API keys).
 *
 * Algorithm: AES-256-GCM. The 32-byte key comes from `SETTINGS_ENCRYPTION_KEY`
 * (base64 or hex). Ciphertext is stored as `base64(iv):base64(authTag):base64(ciphertext)`.
 *
 * The plaintext secret is never logged. Callers decrypt only at the moment of use.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit nonce, recommended for GCM
const KEY_LENGTH = 32; // AES-256

// Parses SETTINGS_ENCRYPTION_KEY into 32 raw bytes. Accepts base64 or hex.
// Throws a clear error if the env var is missing or the wrong length.
function getEncryptionKey(): Buffer {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!raw || raw.trim().length === 0) {
    throw new Error(
      "SETTINGS_ENCRYPTION_KEY is not set. Generate one with: " +
        `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`,
    );
  }

  const trimmed = raw.trim();

  // Try hex first (64 hex chars => 32 bytes), then base64.
  let key: Buffer;
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    key = Buffer.from(trimmed, "hex");
  } else {
    key = Buffer.from(trimmed, "base64");
  }

  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `SETTINGS_ENCRYPTION_KEY must decode to ${KEY_LENGTH} bytes (got ${key.length}). ` +
        "Provide 32 raw bytes encoded as base64 or hex.",
    );
  }

  return key;
}

// Encrypts a plaintext secret. Returns `base64(iv):base64(authTag):base64(ciphertext)`.
export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

// Decrypts a blob produced by encryptSecret. Throws if the format is invalid,
// the key is wrong, or the auth tag fails verification (tamper/rotation).
export function decryptSecret(blob: string): string {
  const key = getEncryptionKey();

  const parts = blob.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format: expected iv:authTag:ciphertext");
  }

  const [ivB64, authTagB64, ciphertextB64] = parts as [string, string, string];
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}

// Returns the last 4 characters of a secret, for masked display (e.g. ••••aB3x).
export function lastFour(secret: string): string {
  return secret.slice(-4);
}
