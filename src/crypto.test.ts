/// <reference types="jest" />
/// <reference types="@types/jest" />

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

  test('Envelope Encryption: wrapKeyWithMasterKey and unwrapKeyWithMasterKey roundtrip', async () => {
    const { wrapKeyWithMasterKey, unwrapKeyWithMasterKey } = await import('../crypto/encryptionEngine');
    const masterKey = await generateAesKey();
    const fileKey = await generateAesKey();
    const rawKeyHex = await exportKeyToHex(fileKey);

    // 1. Wrap the file key with master key
    const { wrappedKeyHex, wrapIvHex } = await wrapKeyWithMasterKey(rawKeyHex, masterKey);
    
    // The wrapped key must NOT equal the raw key (it is encrypted ciphertext)
    expect(wrappedKeyHex).not.toBe(rawKeyHex);
    expect(wrappedKeyHex.startsWith('0x')).toBe(true);
    expect(wrapIvHex.startsWith('0x')).toBe(true);

    // 2. Unwrap the wrapped key with master key
    const unwrappedRawKeyHex = await unwrapKeyWithMasterKey(wrappedKeyHex, wrapIvHex, masterKey);
    expect(unwrappedRawKeyHex).toBe(rawKeyHex);

    // 3. Attempting to unwrap with a different master key must fail
    const wrongMasterKey = await generateAesKey();
    await expect(unwrapKeyWithMasterKey(wrappedKeyHex, wrapIvHex, wrongMasterKey)).rejects.toThrow();
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

describe('DeStorage Folder & Directory Handling Tests', () => {
  test('correctly extracts top-level folder name and clean filename', () => {
    const relativePath = 'deploy-6a3a186320a8740d/assets/hero.png';
    const hasFolder = relativePath.includes('/');
    expect(hasFolder).toBe(true);

    const folderName = relativePath.split('/')[0];
    expect(folderName).toBe('deploy-6a3a186320a8740d');

    const cleanFileName = relativePath.split('/').pop();
    expect(cleanFileName).toBe('hero.png');

    const relativeSubPath = relativePath.startsWith(folderName + '/') 
      ? relativePath.slice(folderName.length + 1) 
      : relativePath;
    expect(relativeSubPath).toBe('assets/hero.png');
  });

  test('standalone root files have no folder prefix', () => {
    const rootFile = 'financial_statement.pdf';
    expect(rootFile.includes('/')).toBe(false);
    expect(rootFile.split('/').pop()).toBe('financial_statement.pdf');
  });

  test('folder grouping calculates aggregate sizes and file counts accurately', () => {
    const mockFiles = [
      { id: '1', name: 'docs/doc1.pdf', size: 1024, timestamp: 1000 },
      { id: '2', name: 'docs/doc2.pdf', size: 2048, timestamp: 2000 },
      { id: '3', name: 'photos/vacation.jpg', size: 4096, timestamp: 1500 },
      { id: '4', name: 'standalone.txt', size: 512, timestamp: 500 },
    ];

    const folderMap = new Map<string, typeof mockFiles>();
    const rootFiles: typeof mockFiles = [];

    for (const f of mockFiles) {
      if (f.name.includes('/')) {
        const folder = f.name.split('/')[0];
        if (!folderMap.has(folder)) folderMap.set(folder, []);
        folderMap.get(folder)!.push(f);
      } else {
        rootFiles.push(f);
      }
    }

    expect(folderMap.size).toBe(2);
    expect(folderMap.get('docs')?.length).toBe(2);
    expect(folderMap.get('photos')?.length).toBe(1);
    expect(rootFiles.length).toBe(1);

    const docsTotalSize = folderMap.get('docs')!.reduce((sum, f) => sum + f.size, 0);
    expect(docsTotalSize).toBe(3072);
  });
});

