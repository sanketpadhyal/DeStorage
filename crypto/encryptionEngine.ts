/**
 * DeStorage Client-Side Web Crypto AES-256-GCM Encryption Engine
 * All operations execute strictly in browser memory. Plaintext never touches any server.
 */

export interface EncryptedFilePayload {
  encryptedBuffer: ArrayBuffer;
  ivHex: string;
  keyHex: string;
  sha256Hash: string;
  originalName: string;
  originalSize: number;
  mimeType: string;
}

// Convert ArrayBuffer to Hex String
export function bufToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex String to Uint8Array
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

// Compute SHA-256 Hash of an ArrayBuffer
export async function computeSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuf = await window.crypto.subtle.digest('SHA-256', buffer);
  return '0x' + bufToHex(hashBuf);
}

// Generate a random 256-bit AES-GCM key
export async function generateAesKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Export CryptoKey to raw hex
export async function exportKeyToHex(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return '0x' + bufToHex(exported);
}

// Import CryptoKey from raw hex
export async function importKeyFromHex(hex: string): Promise<CryptoKey> {
  const bytes = hexToBytes(hex);
  return await window.crypto.subtle.importKey(
    'raw',
    bytes as any,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Derive AES-GCM Key from User Passphrase using PBKDF2
export async function deriveKeyFromPassword(password: string, saltBytes: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password) as any,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a File using AES-256-GCM
 */
export async function encryptFile(
  file: File,
  customPassphrase?: string,
  onProgress?: (stage: string) => void
): Promise<EncryptedFilePayload> {
  if (onProgress) onProgress('Reading file into memory buffer...');
  const fileBuffer = await file.arrayBuffer();

  if (onProgress) onProgress('Computing SHA-256 integrity checksum...');
  const sha256Hash = await computeSha256(fileBuffer);

  if (onProgress) onProgress('Generating 256-Bit cryptographic key & IV...');
  let key: CryptoKey;
  let iv: Uint8Array = window.crypto.getRandomValues(new Uint8Array(12));

  if (customPassphrase && customPassphrase.trim().length > 0) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    key = await deriveKeyFromPassword(customPassphrase, salt);
  } else {
    key = await generateAesKey();
  }

  const keyHex = await exportKeyToHex(key);
  const ivHex = '0x' + bufToHex(iv);

  if (onProgress) onProgress('Executing browser AES-256-GCM encryption...');
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
    },
    key,
    fileBuffer
  );

  return {
    encryptedBuffer,
    ivHex,
    keyHex,
    sha256Hash,
    originalName: file.name,
    originalSize: file.size,
    mimeType: file.type || 'application/octet-stream',
  };
}

/**
 * Decrypt an Encrypted ArrayBuffer using AES-256-GCM
 */
export async function decryptFile(
  encryptedBuffer: ArrayBuffer,
  keyHex: string,
  ivHex: string,
  mimeType: string = 'application/octet-stream'
): Promise<{ decryptedBlob: Blob; objectUrl: string }> {
  const key = await importKeyFromHex(keyHex);
  const iv = hexToBytes(ivHex);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
    },
    key,
    encryptedBuffer
  );

  const decryptedBlob = new Blob([decryptedBuffer], { type: mimeType });
  const objectUrl = URL.createObjectURL(decryptedBlob);

  return { decryptedBlob, objectUrl };
}
