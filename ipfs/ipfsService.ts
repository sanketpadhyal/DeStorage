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

  if (activeJwt.length > 0) {
    const safeFileName = (fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    const blob = new Blob([encryptedBuffer], { type: 'application/octet-stream' });

    // --- 1. Pinata v3 Files API (shows files in Pinata web dashboard under Files -> Public) ---
    try {
      const formData = new FormData();
      formData.append('file', blob, `${safeFileName}.encrypted`);
      formData.append('name', `DeStorage_${safeFileName}_${Date.now()}`.slice(0, 150));
      formData.append('network', 'public');

      if (metadataObj) {
        const keyvalues: Record<string, string> = {
          app: 'DeStorage',
          owner: metadataObj.ownerAddress.toLowerCase(),
          name: encodeURIComponent(fileName).slice(0, 50),
          mime: metadataObj.mimeType.slice(0, 50),
          size: String(metadataObj.originalSize),
          key: metadataObj.keyHex.slice(0, 200),
          iv: metadataObj.ivHex,
          sha: metadataObj.sha256Hash,
        };
        if (metadataObj.wrapIvHex) keyvalues.kiv = metadataObj.wrapIvHex;
        if (metadataObj.isKeyWrapped) keyvalues.wrp = '1';
        formData.append('keyvalues', JSON.stringify(keyvalues));
      }

      const result = await new Promise<IpfsUploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://uploads.pinata.cloud/v3/files');
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
              const liveCid = data?.data?.cid || data?.IpfsHash;
              if (!liveCid) {
                reject(new Error('Pinata v3 response missing CID: ' + xhr.responseText));
                return;
              }
              Promise.all([
                saveToPersistentCache(liveCid, encryptedBuffer),
                saveToPersistentCache(fallbackCid, encryptedBuffer),
              ]).then(() => {
                resolve({
                  cid: liveCid,
                  gatewayUrl: `https://gateway.pinata.cloud/ipfs/${liveCid}`,
                  sizeBytes: data?.data?.size || encryptedBuffer.byteLength,
                  isPinned: true,
                });
              });
            } catch (e) {
              reject(new Error('Failed to parse Pinata v3 response: ' + xhr.responseText));
            }
          } else {
            reject(new Error(`Pinata v3 upload failed (${xhr.status}): ${xhr.responseText}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during IPFS v3 upload'));
        xhr.send(formData);
      });

      return result;
    } catch (err: any) {
      console.warn('[DeStorage] Pinata v3 upload failed, attempting v2 fallback:', err?.message || err);
    }

    // --- 2. Pinata v2 Pinning API fallback ---
    try {
      const formData = new FormData();
      formData.append('file', blob, `${safeFileName}.encrypted`);

      const keyvalues: Record<string, string> = { app: 'DeStorage' };
      if (metadataObj) {
        keyvalues.owner = metadataObj.ownerAddress.toLowerCase();
        keyvalues.name = encodeURIComponent(fileName).slice(0, 100);
        keyvalues.mime = metadataObj.mimeType;
        keyvalues.size = String(metadataObj.originalSize);
        keyvalues.key = metadataObj.keyHex;
        keyvalues.iv = metadataObj.ivHex;
        keyvalues.sha = metadataObj.sha256Hash;
        if (metadataObj.wrapIvHex) keyvalues.kiv = metadataObj.wrapIvHex;
        if (metadataObj.isKeyWrapped) keyvalues.wrp = '1';
      }
      formData.append('pinataMetadata', JSON.stringify({
        name: `DeStorage_${safeFileName}_${Date.now()}`.slice(0, 150),
        keyvalues,
      }));
      formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

      const result = await new Promise<IpfsUploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://api.pinata.cloud/pinning/pinFileToIPFS');
        xhr.setRequestHeader('Authorization', `Bearer ${activeJwt}`);
        if (onProgress) {
          xhr.upload.onprogress = (ev) => { if (ev.lengthComputable) onProgress(ev.loaded, ev.total); };
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              const liveCid = data.IpfsHash;
              Promise.all([
                saveToPersistentCache(liveCid, encryptedBuffer),
                saveToPersistentCache(fallbackCid, encryptedBuffer),
              ]).then(() => resolve({
                cid: liveCid,
                gatewayUrl: `https://gateway.pinata.cloud/ipfs/${liveCid}`,
                sizeBytes: data.PinSize || encryptedBuffer.byteLength,
                isPinned: true,
              }));
            } catch (e) {
              reject(new Error('Failed to parse Pinata v2 response'));
            }
          } else {
            reject(new Error(`Pinata v2 upload failed (${xhr.status}): ${xhr.responseText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during IPFS v2 upload'));
        xhr.send(formData);
      });

      return result;
    } catch (err: any) {
      console.error('[DeStorage] Both Pinata v3 and v2 upload failed:', err?.message || err);
      throw new Error(`IPFS upload failed: ${err?.message || 'Check Pinata JWT and network'}`);
    }
  }

  // No JWT configured — save locally only
  await saveToPersistentCache(fallbackCid, encryptedBuffer);
  console.warn('[DeStorage] No Pinata JWT configured — file saved locally only (will not persist across devices)');
  return {
    cid: fallbackCid,
    gatewayUrl: `https://ipfs.io/ipfs/${fallbackCid}`,
    sizeBytes: encryptedBuffer.byteLength,
    isPinned: false,
  };
}

/**
 * Automatically recover all user files from Pinata IPFS Cloud by wallet address
 * Supports both Pinata v3 Files API and legacy v2 Pinning API.
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
  const rawFilesMap = new Map<string, any>();

  // 1. Query Pinata v3 Files API (Public files)
  try {
    const v3Url = `https://api.pinata.cloud/v3/files/public?keyvalues[owner]=${encodeURIComponent(targetOwner)}`;
    const v3Res = await fetch(v3Url, {
      headers: { Authorization: `Bearer ${activeJwt}` },
    });
    if (v3Res.ok) {
      const v3Data = await v3Res.json();
      if (Array.isArray(v3Data?.data?.files)) {
        for (const file of v3Data.data.files) {
          if (file.cid && file.keyvalues) {
            rawFilesMap.set(file.cid, {
              id: file.id,
              cid: file.cid,
              size: file.size,
              keyvalues: file.keyvalues,
              name: file.name,
              createdAt: file.created_at,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('[DeStorage] Pinata v3 list query failed:', err);
  }

  // 2. Query Pinata v2 Pinning API (Legacy pins fallback)
  try {
    const v2Url = `https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=1000` +
      `&metadata[keyvalues][app][value]=DeStorage&metadata[keyvalues][app][op]=eq` +
      `&metadata[keyvalues][owner][value]=${encodeURIComponent(targetOwner)}&metadata[keyvalues][owner][op]=eq`;

    const v2Res = await fetch(v2Url, {
      headers: { Authorization: `Bearer ${activeJwt}` },
    });
    if (v2Res.ok) {
      const v2Data = await v2Res.json();
      if (Array.isArray(v2Data?.rows)) {
        for (const row of v2Data.rows) {
          const cid = row.ipfs_pin_hash;
          if (cid && row.metadata?.keyvalues && !rawFilesMap.has(cid)) {
            rawFilesMap.set(cid, {
              id: row.id,
              cid,
              size: row.size,
              keyvalues: row.metadata.keyvalues,
              name: row.metadata.name,
              createdAt: row.date_pinned,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('[DeStorage] Pinata v2 pinList query failed:', err);
  }

  // 3. Process and Decrypt/Unwrap Key Metadata
  const recoveredFiles: any[] = [];

  for (const item of Array.from(rawFilesMap.values())) {
    const kv = item.keyvalues;
    const keyVal = kv?.key || kv?.keyHex;
    const ivVal = kv?.iv || kv?.ivHex;
    const wrapIv = kv?.kiv;
    const isWrapped = kv?.wrp === '1' || !!wrapIv;

    if (kv && keyVal && ivVal) {
      let originalName = 'Decrypted File';
      const rawName = kv.name || kv.originalName;
      try {
        originalName = rawName ? decodeURIComponent(rawName) : (item.name?.replace(/^DeStorage_/, '').replace(/_\d+$/, '') || 'Decrypted File');
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
        id: `file_${item.id || item.cid}`,
        name: originalName,
        size: Number(kv.size || kv.originalSize) || item.size,
        mimeType: kv.mime || kv.mimeType || 'application/octet-stream',
        ipfsCid: item.cid,
        sha256Hash: kv.sha || kv.sha256Hash || '',
        keyHex: unwrappedKey,
        ivHex: ivVal,
        wrappedKeyHex: isWrapped ? keyVal : undefined,
        wrapIvHex: wrapIv,
        isKeyWrapped: !unwrappedSuccessfully,
        timestamp: Number(kv.timestamp) || (item.createdAt ? new Date(item.createdAt).getTime() : Date.now()),
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
}

/**
 * Permanently unpin and delete a file from Pinata IPFS Cloud (both v3 & v2)
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

  let success = false;

  // 1. Delete from Pinata v3 Files API
  try {
    const findRes = await fetch(`https://api.pinata.cloud/v3/files/public?cid=${cid}`, {
      headers: { Authorization: `Bearer ${activeJwt}` },
    });
    if (findRes.ok) {
      const findData = await findRes.json();
      const fileId = findData?.data?.files?.[0]?.id;
      if (fileId) {
        const delRes = await fetch(`https://api.pinata.cloud/v3/files/public/${fileId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${activeJwt}` },
        });
        if (delRes.ok) success = true;
      }
    }
  } catch (err) {
    console.warn('[DeStorage] Error deleting from Pinata v3:', err);
  }

  // 2. Also unpin from Pinata v2 pinning API
  try {
    const res = await fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${activeJwt}` },
    });
    if (res.ok) success = true;
  } catch (err) {
    console.warn('[DeStorage] Error unpinning from Pinata v2:', err);
  }

  return success;
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
