import { AesEncryptResult } from "@/types/modem";

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();
const SALT_BYTES: number = 16;
const IV_BYTES: number = 12;
const PBKDF2_ITERATIONS: number = 210_000;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((value: number) => {
    binary += String.fromCharCode(value);
  });
  return window.btoa(binary);
}

function toStrictBytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const strict: Uint8Array<ArrayBuffer> = new Uint8Array<ArrayBuffer>(new ArrayBuffer(bytes.length));
  strict.set(bytes);
  return strict;
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary: string = window.atob(value);
  const out: Uint8Array<ArrayBuffer> = new Uint8Array<ArrayBuffer>(new ArrayBuffer(binary.length));
  for (let index: number = 0; index < binary.length; index += 1) {
    out[index] = binary.charCodeAt(index);
  }
  return out;
}

async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const keyMaterial: CryptoKey = await window.crypto.subtle.importKey(
    "raw",
    toStrictBytes(TEXT_ENCODER.encode(passphrase)),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: PBKDF2_ITERATIONS,
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptPayload(plaintext: string, passphrase: string): Promise<AesEncryptResult> {
  const salt: Uint8Array<ArrayBuffer> = new Uint8Array<ArrayBuffer>(new ArrayBuffer(SALT_BYTES));
  const iv: Uint8Array<ArrayBuffer> = new Uint8Array<ArrayBuffer>(new ArrayBuffer(IV_BYTES));
  window.crypto.getRandomValues(salt);
  window.crypto.getRandomValues(iv);
  const key: CryptoKey = await deriveKey(passphrase, salt);

  const encryptedBuffer: ArrayBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    toStrictBytes(TEXT_ENCODER.encode(plaintext)),
  );

  const encryptedBytes: Uint8Array<ArrayBuffer> = new Uint8Array<ArrayBuffer>(encryptedBuffer);
  const payload: Uint8Array<ArrayBuffer> = new Uint8Array<ArrayBuffer>(
    new ArrayBuffer(salt.length + iv.length + encryptedBytes.length),
  );
  payload.set(salt, 0);
  payload.set(iv, salt.length);
  payload.set(encryptedBytes, salt.length + iv.length);

  return {
    payload: toBase64(payload),
  };
}

export async function decryptPayload(payload: string, passphrase: string): Promise<string> {
  const packed: Uint8Array<ArrayBuffer> = fromBase64(payload);

  if (packed.length <= SALT_BYTES + IV_BYTES) {
    throw new Error("Encrypted payload is invalid.");
  }

  const salt: Uint8Array<ArrayBuffer> = toStrictBytes(packed.slice(0, SALT_BYTES));
  const iv: Uint8Array<ArrayBuffer> = toStrictBytes(packed.slice(SALT_BYTES, SALT_BYTES + IV_BYTES));
  const data: Uint8Array<ArrayBuffer> = toStrictBytes(packed.slice(SALT_BYTES + IV_BYTES));
  const key: CryptoKey = await deriveKey(passphrase, salt);

  const decrypted: ArrayBuffer = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return TEXT_DECODER.decode(decrypted);
}

export async function decryptLineIfEncoded(line: string, passphrase: string): Promise<string> {
  if (!line.startsWith("@ENC:")) {
    return line;
  }

  if (passphrase.trim().length === 0) {
    return "[DECRYPT FAILED: missing passphrase]";
  }

  try {
    const encodedPayload: string = line.slice(5);
    return await decryptPayload(encodedPayload, passphrase);
  } catch {
    return "[DECRYPT FAILED]";
  }
}
