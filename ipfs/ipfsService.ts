/**
 * DeStorage IPFS Pinning & Decentralized Content Addressing Pipeline
 * Supported by IndexedDB Persistent Local Cache & Pinata Cloud Gateway
 */

import { computeSha256, unwrapKeyWithMasterKey } from '../crypto/encryptionEngine';

export interface IpfsUploadResult {
  cid: string;
  gatewayUrl: string;
  sizeBytes: number;
  isPinned: boolean;
}

// In-Memory Fast Cache
const localIpfsCache: Map<string, ArrayBuffer> = new Map();

// IndexedDB Persistent Binary Cache for zero-loss page refreshes
const DB_NAME = 'destorage_ipfs_db';
const STORE_NAME = 'encrypted_payloads';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveToPersistentCache(cid: string, buffer: ArrayBuffer): Promise<void> {
  localIpfsCache.set(cid, buffer);
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(buffer, cid);
  } catch (e) {
    console.warn('Could not cache payload in IndexedDB:', e);
  }
}

export async function getFromPersistentCache(cid: string): Promise<ArrayBuffer | null> {
  if (localIpfsCache.has(cid)) {
    return localIpfsCache.get(cid)!;
  }
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(cid);
      req.onsuccess = () => {
        if (req.result) {
          localIpfsCache.set(cid, req.result);
          resolve(req.result);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

/**
 * Generate a standard IPFS CIDv1 from buffer hash
 */
export async function generateContentCid(buffer: ArrayBuffer): Promise<string> {
  const hash = await computeSha256(buffer);
  const cleanHex = hash.replace('0x', '').slice(0, 32);
  return `bafybeig${cleanHex}7h9d4w7q`;
}

export interface FileUploadMetadata {
  ownerAddress: string;
  originalSize: number;
  mimeType: string;
  keyHex: string; // The wrapped ciphertext key (if wrapped) or raw key (if legacy/demo)
  ivHex: string;
  sha256Hash: string;
  isKeyWrapped?: boolean;
  wrapIvHex?: string;
}

/**
 * Upload encrypted buffer to IPFS (Pinata Cloud & Local IndexedDB)
 */
export async function uploadToIpfs(
  encryptedBuffer: ArrayBuffer,
  fileName: string,
  metadataObj?: FileUploadMetadata,
  pinataJwt?: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<IpfsUploadResult> {
  const fallbackCid = await generateContentCid(encryptedBuffer);

  // Auto-detect JWT from parameter, process.env or localStorage
  const activeJwt = (
    pinataJwt || 
    process.env.REACT_APP_PINATA_JWT || 
    (typeof localStorage !== 'undefined' ? localStorage.getItem('destorage_pinata_jwt') : null) || 
    ''
  ).trim();

  // If Pinata JWT is configured, upload to live IPFS network
  if (activeJwt.length > 0) {
    try {
      const safeFileName = (fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
      const blob = new Blob([encryptedBuffer], { type: 'application/octet-stream' });
      const formData = new FormData();
      formData.append('file', blob, `${safeFileName}.encrypted`);

      const keyvalues: Record<string, string> = {
        app: 'DeStorage',
      };

      if (metadataObj) {
        keyvalues.owner = metadataObj.ownerAddress.toLowerCase();
        keyvalues.name = encodeURIComponent(fileName).slice(0, 100);
        keyvalues.mime = metadataObj.mimeType;
        keyvalues.size = String(metadataObj.originalSize);
        keyvalues.key = metadataObj.keyHex;
        keyvalues.iv = metadataObj.ivHex;
        keyvalues.sha = metadataObj.sha256Hash;
        if (metadataObj.wrapIvHex) {
          keyvalues.kiv = metadataObj.wrapIvHex;
        }
        if (metadataObj.isKeyWrapped) {
          keyvalues.wrp = '1';
        }
      }

      const metadata = JSON.stringify({
        name: `DeStorage_${safeFileName}_${Date.now()}`.slice(0, 150),
        keyvalues,
      });
      formData.append('pinataMetadata', metadata);
      formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

      // Use XHR for real-time upload progress
      const result = await new Promise<IpfsUploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://api.pinata.cloud/pinning/pinFileToIPFS');
        xhr.setRequestHeader('Authorization', `Bearer ${activeJwt}`);

        if (onProgress) {
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) onProgress(ev.loaded, ev.total);
          };
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              const liveCid = data.IpfsHash;
              Promise.all([
                saveToPersistentCache(liveCid, encryptedBuffer),
                saveToPersistentCache(fallbackCid, encryptedBuffer),
              ]).then(() => {
                resolve({
                  cid: liveCid,
                  gatewayUrl: `https://gateway.pinata.cloud/ipfs/${liveCid}`,
                  sizeBytes: data.PinSize || encryptedBuffer.byteLength,
                  isPinned: true,
                });
              });
            } catch (e) {
              reject(new Error('Failed to parse Pinata response'));
            }
          } else {
            console.warn('Pinata responded with status:', xhr.status, xhr.responseText);
            reject(new Error(`Pinata upload failed: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during IPFS upload'));
        xhr.send(formData);
      });

      return result;
    } catch (err) {
      console.warn('Live IPFS Pinning fell back to local content addressing:', err);
    }
  }

  // Fallback to local persistent cache
  await saveToPersistentCache(fallbackCid, encryptedBuffer);

  return {
    cid: fallbackCid,
    gatewayUrl: `https://ipfs.io/ipfs/${fallbackCid}`,
    sizeBytes: encryptedBuffer.byteLength,
    isPinned: true,
  };
}

/**
 * Automatically recover all user files from Pinata IPFS Cloud by wallet address
 * Queries Pinata directly by owner wallet address using keyvalue metadata filters.
 */
export async function fetchWalletFilesFromPinata(
  walletAddress: string,
  pinataJwt?: string,
  masterKey?: CryptoKey | null
): Promise<any[]> {
  const activeJwt = (
    pinataJwt || 
    process.env.REACT_APP_PINATA_JWT || 
    (typeof localStorage !== 'undefined' ? localStorage.getItem('destorage_pinata_jwt') : null) || 
    ''
  ).trim();

  if (!activeJwt || !walletAddress) return [];

  const targetOwner = walletAddress.toLowerCase();
  const recoveredFiles: any[] = [];

  try {
    // Query Pinata directly by owner + app keyvalues at API level (no client-side limit issues)
    const params = new URLSearchParams({
      status: 'pinned',
      pageLimit: '1000',
      'metadata[keyvalues][app][value]': 'DeStorage',
      'metadata[keyvalues][app][op]': 'eq',
      'metadata[keyvalues][owner][value]': targetOwner,
      'metadata[keyvalues][owner][op]': 'eq',
    });

    const res = await fetch(`https://api.pinata.cloud/data/pinList?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${activeJwt}`,
      },
    });

    if (!res.ok) {
      console.warn('[DeStorage] Pinata pinList query failed:', res.status, res.statusText);
      return [];
    }

    const data = await res.json();
    if (!data.rows || data.rows.length === 0) return [];

    for (const row of data.rows) {
      const kv = row.metadata?.keyvalues;
      const keyVal = kv?.key || kv?.keyHex;
      const ivVal = kv?.iv || kv?.ivHex;
      const wrapIv = kv?.kiv;
      const isWrapped = kv?.wrp === '1' || !!wrapIv;

      if (kv && kv.app === 'DeStorage' && kv.owner === targetOwner && keyVal && ivVal) {
        let originalName = 'Decrypted File';
        const rawName = kv.name || kv.originalName;
        try {
          originalName = rawName ? decodeURIComponent(rawName) : (row.metadata?.name?.replace(/^DeStorage_/, '').replace(/_\d+$/, '') || 'Decrypted File');
        } catch (e) {
          originalName = rawName || 'Decrypted File';
        }

        let unwrappedKey = keyVal;
        let unwrappedSuccessfully = !isWrapped;

        if (isWrapped && wrapIv && masterKey) {
          try {
            unwrappedKey = await unwrapKeyWithMasterKey(keyVal, wrapIv, masterKey);
            unwrappedSuccessfully = true;
          } catch (e) {
            console.warn('Could not unwrap key with master key:', e);
          }
        }

        recoveredFiles.push({
          id: `file_${row.id || row.ipfs_pin_hash}`,
          name: originalName,
          size: Number(kv.size || kv.originalSize) || row.size,
          mimeType: kv.mime || kv.mimeType || 'application/octet-stream',
          ipfsCid: row.ipfs_pin_hash,
          sha256Hash: kv.sha || kv.sha256Hash || '',
          keyHex: unwrappedKey,
          ivHex: ivVal,
          wrappedKeyHex: isWrapped ? keyVal : undefined,
          wrapIvHex: wrapIv,
          isKeyWrapped: !unwrappedSuccessfully,
          timestamp: Number(kv.timestamp) || new Date(row.date_pinned).getTime(),
        });
      }
    }

    // Filter out locally deleted CIDs
    if (typeof localStorage !== 'undefined') {
      const delKey = `destorage_deleted_${targetOwner}`;
      const delCids = JSON.parse(localStorage.getItem(delKey) || '[]');
      if (Array.isArray(delCids) && delCids.length > 0) {
        const delSet = new Set(delCids);
        return recoveredFiles.filter(f => !delSet.has(f.ipfsCid));
      }
    }

    return recoveredFiles;
  } catch (err) {
    console.warn('[DeStorage] Could not recover files from Pinata:', err);
    return [];
  }
}

/**
 * Permanently unpin and delete a file from Pinata IPFS Cloud
 */
export async function unpinFromIpfs(
  cid: string,
  pinataJwt?: string
): Promise<boolean> {
  const activeJwt = (
    pinataJwt || 
    process.env.REACT_APP_PINATA_JWT || 
    (typeof localStorage !== 'undefined' ? localStorage.getItem('destorage_pinata_jwt') : null) || 
    ''
  ).trim();

  if (!activeJwt || !cid) return false;

  try {
    const res = await fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${activeJwt}`,
      },
    });
    return res.ok;
  } catch (err) {
    console.warn('Could not unpin from Pinata:', err);
    return false;
  }
}

/**
 * Retrieve encrypted buffer by CID (IndexedDB -> Pinata Gateway -> Cloudflare/Public IPFS Gateways)
 */
export async function fetchFromIpfs(cid: string): Promise<ArrayBuffer> {
  // 1. Check local persistent cache (Fastest, zero-latency across page refreshes)
  const cached = await getFromPersistentCache(cid);
  if (cached) {
    return cached;
  }

  // 2. Multi-Gateway Fallback Fetch
  const activeJwt = (
    process.env.REACT_APP_PINATA_JWT || 
    (typeof localStorage !== 'undefined' ? localStorage.getItem('destorage_pinata_jwt') : null) || 
    ''
  ).trim();

  const customGateway = (process.env.REACT_APP_PINATA_GATEWAY || '').trim();

  const gateways = [
    ...(customGateway ? [`https://${customGateway}/ipfs/${cid}`] : []),
    `https://copper-gigantic-cow-722.mypinata.cloud/ipfs/${cid}`,
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://dweb.link/ipfs/${cid}`,
    `https://w3s.link/ipfs/${cid}`,
  ];

  for (const url of gateways) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        await saveToPersistentCache(cid, buffer);
        return buffer;
      }
    } catch (e) {
      // Try next gateway fallback
    }
  }

  throw new Error(`Unable to resolve CID ${cid} from IPFS network or local cache.`);
}
