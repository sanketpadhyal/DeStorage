# DeStorage Protocol Architecture

DeStorage is a decentralized, zero-knowledge cloud storage platform engineered on Base Sepolia EVM, InterPlanetary File System (IPFS), and client-side Web Crypto AES-256-GCM.

```
+-------------------------------------------------------------+
|                     User Browser (Client)                   |
|                                                             |
|   1. File Selected                                          |
|   2. SHA-256 Hash Computed                                  |
|   3. 256-Bit Key & 12-Byte IV Generated                     |
|   4. AES-256-GCM Encryption in Web Crypto                   |
+------------------------------+------------------------------+
                               |
                               v (Encrypted Ciphertext Only)
+------------------------------+------------------------------+
|                Decentralized Storage Layer                  |
|                                                             |
|   - IPFS Content Addressing (CIDv1 bafybeig...)             |
|   - Pinata IPFS Distributed Gateway Pinning                 |
+------------------------------+------------------------------+
                               |
                               v (CID + SHA-256 Checksum Proof)
+------------------------------+------------------------------+
|                  Base Sepolia EVM Layer                     |
|                                                             |
|   - DeStorageVault.sol Smart Contract Registry              |
|   - Zero-Knowledge Access Control & Ownership Verification  |
+-------------------------------------------------------------+
```

## Directory Structure
- `src/assets/` - Image assets, logos, brand illustrations
- `src/crypto/` - Client-side AES-256-GCM encryption & PBKDF2 key derivation
- `src/ipfs/` - IPFS pinning & content addressing pipeline
- `src/web3/` - Base Sepolia EVM wallet context & RPC client
- `src/vault/` - Interactive encrypted vault dashboard & zero-knowledge viewer
- `src/landingpage/` - Glassmorphic landing page & interactive cipher sandbox
- `src/types/` - Centralized TypeScript interfaces
- `src/config/` - Protocol constants & network configurations
- `src/utils/` - Formatter helpers & binary converters
- `contracts/` - Solidity smart contracts
