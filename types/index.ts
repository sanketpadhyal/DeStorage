/**
 * DeStorage Enterprise TypeScript Type Definitions
 */

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

export interface EncryptedPayload {
  encryptedBuffer: ArrayBuffer;
  ivHex: string;
  keyHex: string;
  sha256Hash: string;
  originalName: string;
  originalSize: number;
  mimeType: string;
}

export interface IpfsResult {
  cid: string;
  gatewayUrl: string;
  sizeBytes: number;
  isPinned: boolean;
}

export interface Web3WalletState {
  address: string | null;
  chainId: number | null;
  isBaseSepolia: boolean;
  balance: string;
  isConnecting: boolean;
  isConnected: boolean;
}

export type ViewMode = 'landing' | 'vault';
