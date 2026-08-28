/**
 * DeStorage Zero-Knowledge Cross-Device Vault Sync Engine
 * Uses Web3 Wallet Signatures (EIP-191 / EIP-712) to derive an AES-256 Master Key
 * Encrypts the user's file registry and syncs it securely to the decentralized IPFS Cloud.
 */

import { bufToHex, hexToBytes } from './encryptionEngine';

export interface VaultFileItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  ipfsCid: string;
  sha256Hash: string;
  keyHex: string;
  ivHex: string;
  wrappedKeyHex?: string;
  wrapIvHex?: string;
  isKeyWrapped?: boolean;
  timestamp: number;
  encryptedBuffer?: ArrayBuffer;
}

export interface EncryptedVaultPayload {
  ciphertextHex: string;
  ivHex: string;
  updatedAt: number;
  version: number;
  fileCount: number;
}

export const VAULT_SYNC_SIGNATURE_MESSAGE = (address: string) => 
  `Unlock DeStorage Sovereign Vault for ${address.toLowerCase()}\n\n` +
  `This cryptographic signature derives your zero-knowledge master key to securely synchronize and decrypt your encrypted vault across all your devices.\n\n` +
  `Security Notice: This request is 100% free and does not trigger any blockchain transaction or gas fee.`;

/**
 * Derive an AES-256-GCM Master Key from Wallet Signature
 */
export async function deriveMasterKeyFromSignature(
  signature: string,
  walletAddress: string
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const sigBytes = enc.encode(signature);
  const saltBytes = enc.encode(`destorage_salt_${walletAddress.toLowerCase()}`);

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    sigBytes as any,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes as any,
      iterations: 120000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt the entire Vault Registry JSON with the user's Master Key
 */
export async function encryptVaultRegistry(
  files: VaultFileItem[],
  masterKey: CryptoKey
): Promise<EncryptedVaultPayload> {
  const enc = new TextEncoder();
  const cleanFiles = files.map(f => ({
    id: f.id,
    name: f.name,
    size: f.size,
    mimeType: f.mimeType,
    ipfsCid: f.ipfsCid,
    sha256Hash: f.sha256Hash,
    keyHex: f.keyHex,
    ivHex: f.ivHex,
    timestamp: f.timestamp,
  }));

  const jsonStr = JSON.stringify(cleanFiles);
  const jsonBytes = enc.encode(jsonStr);

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
    },
    masterKey,
    jsonBytes
  );

  return {
    ciphertextHex: bufToHex(encryptedBuffer),
    ivHex: '0x' + bufToHex(iv),
    updatedAt: Date.now(),
    version: 1,
    fileCount: cleanFiles.length,
  };
}

/**
 * Decrypt the Vault Registry JSON using the Master Key
 */
export async function decryptVaultRegistry(
  payload: EncryptedVaultPayload,
  masterKey: CryptoKey
): Promise<VaultFileItem[]> {
  const cipherBytes = hexToBytes(payload.ciphertextHex);
  const ivBytes = hexToBytes(payload.ivHex);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes as any,
    },
    masterKey,
    cipherBytes as any
  );

  const dec = new TextDecoder();
  const jsonStr = dec.decode(decryptedBuffer);
  return JSON.parse(jsonStr);
}

/**
 * Sync the encrypted Vault Registry to Pinata IPFS Cloud
 */
export async function syncVaultToCloud(
  walletAddress: string,
  files: VaultFileItem[],
  masterKey: CryptoKey,
  pinataJwt?: string
): Promise<string | null> {
  const activeJwt = (
    pinataJwt || 
    process.env.REACT_APP_PINATA_JWT || 
    (typeof localStorage !== 'undefined' ? localStorage.getItem('destorage_pinata_jwt') : null) || 
    ''
  ).trim();

  if (!activeJwt) return null;

  try {
    const encryptedPayload = await encryptVaultRegistry(files, masterKey);

    const body = {
      pinataOptions: {
        cidVersion: 1,
      },
      pinataMetadata: {
        name: `DeStorage_Vault_${walletAddress.toLowerCase()}`,
        keyvalues: {
          app: 'DeStorage',
          type: 'destorage_vault_sync',
          owner: walletAddress.toLowerCase(),
          updatedAt: String(encryptedPayload.updatedAt),
        },
      },
      pinataContent: encryptedPayload,
    };

    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeJwt}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return data.IpfsHash;
    }
  } catch (err) {
    console.warn('Cross-device vault cloud sync failed:', err);
  }
  return null;
}

/**
 * Fetch and decrypt the Vault Registry from Pinata IPFS Cloud
 */
export async function fetchVaultFromCloud(
  walletAddress: string,
  masterKey: CryptoKey,
  pinataJwt?: string
): Promise<VaultFileItem[] | null> {
  const activeJwt = (
    pinataJwt || 
    process.env.REACT_APP_PINATA_JWT || 
    (typeof localStorage !== 'undefined' ? localStorage.getItem('destorage_pinata_jwt') : null) || 
    ''
  ).trim();

  if (!activeJwt) return null;

  try {
    const query = new URLSearchParams({
      status: 'pinned',
      'metadata[name]': `DeStorage_Vault_${walletAddress.toLowerCase()}`,
      pageLimit: '1',
      sort: 'DESC',
    });

    const listRes = await fetch(`https://api.pinata.cloud/data/pinList?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${activeJwt}`,
      },
    });

    if (!listRes.ok) return null;

    const listData = await listRes.json();
    if (!listData.rows || listData.rows.length === 0) return null;

    const latestPin = listData.rows[0];
    const cid = latestPin.ipfs_pin_hash;

    // Fetch the encrypted JSON content from IPFS Gateway
    const gateway = process.env.REACT_APP_PINATA_GATEWAY || 'gateway.pinata.cloud';
    const contentRes = await fetch(`https://${gateway}/ipfs/${cid}`, {
      headers: {
        Authorization: `Bearer ${activeJwt}`,
      },
    });

    if (contentRes.ok) {
      const encryptedPayload: EncryptedVaultPayload = await contentRes.json();
      const files = await decryptVaultRegistry(encryptedPayload, masterKey);
      return files;
    }
  } catch (err) {
    console.warn('Could not fetch vault from cloud:', err);
  }
  return null;
}
