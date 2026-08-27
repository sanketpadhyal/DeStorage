/**
 * DeStorage Protocol Constants & Network Configurations
 */

export const APP_CONFIG = {
  appName: 'DeStorage',
  tagline: 'Decentralized Zero-Knowledge Cloud Storage',
  version: '2.0.0',
  author: 'Sanket Padhyal',
  authorWebsite: 'https://sanketpadhyal.in',
  githubUrl: 'https://github.com/sanketpadhyal/DeStorage',
};

export const BLOCKCHAIN_CONFIG = {
  baseSepolia: {
    chainIdHex: '0x14a34',
    chainIdDecimal: 84532,
    chainName: 'Base Sepolia Testnet',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    currency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  baseMainnet: {
    chainIdHex: '0x2105',
    chainIdDecimal: 8453,
    chainName: 'Base Mainnet',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
  },
};

export const CRYPTO_CONFIG = {
  algorithm: 'AES-GCM',
  keyLengthBits: 256,
  ivLengthBytes: 12,
  pbkdf2Iterations: 100000,
  hashAlgorithm: 'SHA-256',
};

export const IPFS_CONFIG = {
  defaultGateway: 'https://ipfs.io/ipfs/',
  pinataApiUrl: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
  pinataGateway: 'https://gateway.pinata.cloud/ipfs/',
};
