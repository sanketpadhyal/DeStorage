import { TextEncoder, TextDecoder } from 'util';
import { webcrypto } from 'crypto';

// Setup environment polyfills for Node/JSDOM test runner
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder as any;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as any;
}
if (typeof window !== 'undefined' && !window.crypto?.subtle) {
  Object.defineProperty(window, 'crypto', {
    value: webcrypto,
    writable: true,
  });
}

import { 
  bufToHex, 
  hexToBytes, 
  computeSha256, 
  generateAesKey, 
  exportKeyToHex, 
  importKeyFromHex, 
  deriveKeyFromPassword 
} from '../crypto/encryptionEngine';
import { formatFileSize, truncateAddress, truncateCid } from '../utils/formatters';

describe('DeStorage Cryptographic Engine Tests', () => {
  test('bufToHex and hexToBytes should accurately roundtrip', () => {
    const raw = new Uint8Array([0, 15, 16, 255, 128, 64]);
    const hex = bufToHex(raw);
    expect(hex).toBe('000f10ff8040');
    const restored = hexToBytes(hex);
    expect(restored).toEqual(raw);
  });

  test('computeSha256 should generate valid deterministic 256-bit hash', async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode('DeStorage Sovereign Zero-Knowledge Cloud');
    const hash = await computeSha256(data.buffer);
    expect(hash.startsWith('0x')).toBe(true);
    expect(hash.length).toBe(66);
    
    // Deterministic check
    const hash2 = await computeSha256(data.buffer);
    expect(hash2).toBe(hash);
  });

  test('AES-256-GCM Key Generation, Export, and Import cycle', async () => {
    const key = await generateAesKey();
    expect(key.algorithm.name).toBe('AES-GCM');
    
    const hex = await exportKeyToHex(key);
    expect(hex.startsWith('0x')).toBe(true);
    expect(hex.length).toBe(66);

    const importedKey = await importKeyFromHex(hex);
    expect(importedKey.algorithm.name).toBe('AES-GCM');
  });

  test('PBKDF2 Key Derivation derives valid 256-bit key from passphrase', async () => {
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    const key = await deriveKeyFromPassword('my-secret-vault-passphrase', salt);
    expect(key.algorithm.name).toBe('AES-GCM');
    const hex = await exportKeyToHex(key);
    expect(hex.length).toBe(66);
  });
});

describe('DeStorage Formatters Tests', () => {
  test('formatFileSize formats bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(25920000)).toBe('24.72 MB');
  });

  test('truncateAddress truncates Ethereum / EVM addresses cleanly', () => {
    const addr = '0x1234567890abcdef1234567890abcdef12345678';
    expect(truncateAddress(addr, 6, 4)).toBe('0x1234...5678');
  });

  test('truncateCid truncates IPFS CIDs properly', () => {
    const cid = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
    expect(truncateCid(cid, 10, 6)).toBe('bafybeigdy...5fbzdi');
  });
});
