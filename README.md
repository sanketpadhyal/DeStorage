<p align="center">
  <img src="public/logo.png" alt="DeStorage Logo" width="110" height="110" style="border-radius: 22px;" />
</p>

<h1 align="center">DeStorage</h1>

<p align="center">
  <strong>Sovereign Web3 & Crypto Decentralized Storage Platform</strong><br>
  <em>Zero-Knowledge Client-Side AES-256-GCM Encryption • IPFS P2P Content Addressing • Base EVM Verification</em>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black" alt="React" /></a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto"><img src="https://img.shields.io/badge/Cryptography-AES--256--GCM-059669" alt="Cryptography" /></a>
  <a href="https://ipfs.tech"><img src="https://img.shields.io/badge/Storage-IPFS%20Network-0284C7?logo=ipfs&logoColor=white" alt="Storage" /></a>
  <a href="https://base.org"><img src="https://img.shields.io/badge/Network-Base%20EVM-0052FF?logo=coinbase&logoColor=white" alt="Blockchain" /></a>
</p>

**DeStorage** is a high-performance, non-custodial decentralized storage platform. It bridges native client-side **AES-256-GCM** encryption with the **InterPlanetary File System (IPFS)** and **Base EVM** blockchain verification. All cryptographic operations execute strictly inside browser memory (`SubtleCrypto`), guaranteeing zero-knowledge privacy: plaintext data and encryption keys never touch any centralized server or storage node.

**Live URL:** [https://destorage.sanketpadhyal.in](https://destorage.sanketpadhyal.in)

---

## Table of Contents

- [Architectural Overview](#architectural-overview)
- [Zero-Knowledge Cryptographic Pipeline](#zero-knowledge-cryptographic-pipeline)
- [Core Features](#core-features)
- [Decentralized Storage & Sync Protocol](#decentralized-storage--sync-protocol)
- [System Data Flows](#system-data-flows)
- [Tech Stack](#tech-stack)
- [Project Directory Structure](#project-directory-structure)
- [Environment Configuration](#environment-configuration)
- [Getting Started](#getting-started)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Security Model](#security-model)
- [License](#license)

---

## Architectural Overview

```text
+-----------------------------------------------------------------------------------+
|                                  CLIENT BROWSER                                   |
|                                                                                   |
|  [ File Dropzone / Multi-File Selector ]                                          |
|       |                                                                           |
|       v                                                                           |
|  [ Web Crypto API (SubtleCrypto) ]                                                |
|       |-- SHA-256 Checksum Calculation                                            |
|       |-- 256-bit Random File Key (DEK) & 96-bit IV Generation                     |
|       |-- AES-256-GCM Binary Encryption (Plaintext -> Ciphertext)                 |
|       |                                                                           |
|  [ Web3 Wallet Signature -> Master Key Derivation ]                              |
|       |-- EIP-191 Free Signature ("Unlock DeStorage Sovereign Vault")             |
|       |-- PBKDF2 Master Key Derivation (120,000 SHA-256 iterations)              |
|       `-- Key Wrapping: AES-256-GCM Encrypt(MasterKey, FileKey) -> Wrapped Key    |
|                                                                                   |
|       +------------------------------------+                                      |
|       | (Encrypted Ciphertext Buffer)      | (Plaintext & Raw Keys Kept in RAM)   |
|       v                                    v                                      |
|  [ IndexedDB Persistent Cache ]     [ XMLHttpRequest (XHR Upload) ]               |
|  Stores ciphertext locally for      Live Transfer Tracking (Loaded / Total Bytes) |
|  instant retrieval & offline cache  Speed Calculation (MB/s) & Dynamic ETA        |
+-----------------------------------------------------------------------------------+
                                         |
                                         | Encrypted Binary + Wrapped Key Metadata (Pinata API)
                                         v
+-----------------------------------------------------------------------------------+
|                             DECENTRALIZED IPFS NETWORK                            |
|                                                                                   |
|  [ Global IPFS Pinning Nodes ]                                                    |
|  - Content-Addressed Storage via Immutable CIDv1 (bafy...)                        |
|  - Cloud Metadata: owner, mime, size, sha256, WRAPPED CIPHERTEXT KEY, iv, kiv      |
|  - Zero Plaintext Keys on Network: Pinata / IPFS only store encrypted blobs        |
|  - Multi-Gateway Fallback Chain (Dedicated Gateway -> Pinata Cloud -> ipfs.io)    |
+-----------------------------------------------------------------------------------+
                                         ^
                                         | Verification & Wallet Authentication
+-----------------------------------------------------------------------------------+
|                              BASE EVM BLOCKCHAIN LAYER                            |
|                                                                                   |
|  [ Web3 Wallet Provider (Ethers.js v6 / MetaMask / Coinbase) ]                    |
|  - Non-custodial cryptographic wallet verification                                |
|  - Sovereign identity without centralized databases or passwords                  |
+-----------------------------------------------------------------------------------+
```

---

## Zero-Knowledge Cryptographic Pipeline

Every file processed by DeStorage passes through a multi-stage cryptographic pipeline executed via standard W3C Web Cryptography primitives (`window.crypto.subtle`):

### 1. Integrity Hashing (SHA-256)
Prior to encryption, a deterministic cryptographic checksum is generated across the plaintext buffer:
```text
hash = SHA-256(plaintext_buffer)
```
This checksum is stored alongside the file metadata and re-validated upon decryption to ensure byte-level integrity.

### 2. File Data Encryption (AES-256-GCM)
* **Data Encryption Key (DEK)**: Generates a cryptographically strong, unique 256-bit AES key via `window.crypto.subtle.generateKey` and a 96-bit Initialization Vector (IV) via `window.crypto.getRandomValues`.
* **Authenticated Symmetric Cipher**: The plaintext binary is encrypted using Galois/Counter Mode (GCM), providing authenticated encryption with associated data (AEAD) to protect both confidentiality and authenticity against tampering:
```text
ciphertext = AES-GCM-Encrypt(DEK_256, iv_96, plaintext_buffer)
```

### 3. Envelope Encryption & Key Wrapping
To enable cross-device synchronization without exposing plaintext keys to cloud pinning servers:
1. **Master Key (KEK)**: Derived strictly in client memory from the user's Web3 wallet signature using **PBKDF2 with 120,000 iterations of SHA-256** and a wallet-scoped salt:
```text
MasterKey = PBKDF2(Signature, salt="destorage_salt_{address}", iterations=120000, hash=SHA-256)
```
2. **Key Wrapping (`wrapKeyWithMasterKey`)**: The unique 256-bit file key (`DEK`) is encrypted using the user's `MasterKey` with a dedicated 96-bit wrapping IV (`kiv`):
```text
wrappedKeyCiphertext = AES-GCM-Encrypt(MasterKey, wrap_iv_96, DEK_raw_bytes)
```
3. **Network Zero-Knowledge Guarantee**: Only `wrappedKeyCiphertext` and `wrap_iv_96` are uploaded in cloud metadata. Pinata, IPFS nodes, and network observers **never receive or possess the raw decryption key**.

### 4. Zero-Knowledge Decryption & Key Unwrapping
When viewing or downloading a file on any device:
1. Ciphertext is fetched from IndexedDB cache or streamed from the decentralized IPFS gateway.
2. If opening on a new device, the browser unwraps the key in memory:
```text
DEK_raw_bytes = AES-GCM-Decrypt(MasterKey, wrap_iv_96, wrappedKeyCiphertext)
```
3. Decryption of the file payload occurs strictly in-memory into an ephemeral `Blob` and `Object URL`.
4. Plaintext is released as a download or rendered in an isolated browser preview modal, leaving zero residual plaintext or unencrypted keys on any server.

---

## Core Features

### Envelope Encryption & Key Wrapping
- True Zero-Knowledge security: Raw AES-256 file keys never leave browser memory.
- Master Key derived from Web3 wallet signatures via **PBKDF2 (120,000 rounds)**.
- Pinata cloud only receives double-encrypted ciphertext keys (`wrappedKeyHex`).

### Multi-File Batch Upload (Up to 10 Files)
- Batch upload queue supporting photos, videos, documents, PDFs, and binary archives simultaneously.
- Real-time `XMLHttpRequest` byte tracking with active transfer speed (`MB/s` or `KB/s`) and dynamic completion ETA (`~12s left`).
- Gradient progress visualization with per-file status logs.

### Multi-Select Bulk Vault Deletion
- Checkbox-based multi-select mode with **Select All** / **Deselect All** capabilities.
- Atomic unpinning from Pinata IPFS Cloud (`DELETE /pinning/unpin/{cid}`) combined with local blacklist synchronization to prevent re-discovery during cross-device auto-sync.

### Cross-Device Cloud Auto-Sync
- Wallet-bound file indexing via Pinata IPFS metadata keyvalues (`owner`, `name`, `mime`, `size`, `key`, `iv`, `kiv`, `wrp`, `sha`).
- Automatic vault reconstruction and in-memory key unwrapping on wallet connection across multiple devices.

### In-Memory Decryption & Media Preview
- Seamless browser preview for images, media, and text documents without writing unencrypted bytes to disk.
- Clean linear shimmer wave skeleton placeholder during image and asset loading with automatic `localStorage` caching.

### High-Fidelity UI / UX
- Mobile-optimized navbar with compact wallet pill (`0xf0...5b0c`) and native deep-links for mobile MetaMask and Coinbase Wallet apps.
- Hardware-accelerated smooth scrolling via **Lenis**.
- Dynamic reactive tab title updates reflecting real-time upload progress, decryption status, and vault counts.

---

## Decentralized Storage & Sync Protocol

DeStorage utilizes a dual-layer caching and pinning strategy:

1. **Persistent Binary Storage (IndexedDB)**:
   - Encrypted ArrayBuffers are cached in client IndexedDB (`destorage_ipfs_db / encrypted_payloads`).
   - Enables instantaneous offline file decryption and preview without redundant network gateway requests.

2. **Decentralized Distribution (IPFS Pinning Network)**:
   - Ciphertext payloads are pinned to IPFS nodes using Pinata REST APIs.
   - Pinned objects carry sovereign metadata keyvalues (scoped within the 10-key limit) mapped to the connected wallet address:
     - `app`: `DeStorage`
     - `owner`: `<wallet_address_lowercase>`
     - `name`: `<encoded_filename>`
     - `mime`: `<mime_type>`
     - `size`: `<original_size_bytes>`
     - `key`: `<wrapped_key_ciphertext_hex>` (Double-encrypted, NEVER plaintext)
     - `iv`: `<file_initialization_vector_hex>`
     - `kiv`: `<key_wrapping_initialization_vector_hex>`
     - `wrp`: `1` (indicates wrapped key protocol)
     - `sha`: `<sha256_checksum>`

3. **CORS-Compliant Gateway Fallback Chain**:
   - Primary: Dedicated custom IPFS gateway (`REACT_APP_PINATA_GATEWAY`).
   - Secondary: `https://gateway.pinata.cloud/ipfs/{cid}`.
   - Tertiary: Public IPFS gateways (`https://ipfs.io/ipfs/{cid}`, `https://cloudflare-ipfs.com/ipfs/{cid}`).

---

## System Data Flows

### File Upload Flow

```text
[ User Selects Files ]
       |
       v
[ SubtleCrypto: AES-256-GCM Encryption ]
       |
       v
[ XHR Stream to IPFS Endpoint with Live onprogress ]
       |
       +---> Emits (loaded / total) -> UI Progress Bar, Speed (MB/s), ETA (s)
       |
       v
[ IPFS Node Returns CIDv1 (bafy...) ]
       |
       +---> Cache Ciphertext to Local IndexedDB
       +---> Persist Metadata to localStorage (`destorage_vault_files_{address}`)
       `---> Update Vault Dashboard State
```

### File Retrieval & Decryption Flow

```text
[ User Requests Preview / Download ]
       |
       v
[ Check IndexedDB Binary Cache ]
       |-- Found ------> Read Encrypted ArrayBuffer from Memory
       `-- Not Found --> Stream Ciphertext from IPFS Gateway (No Auth Header)
                                |
                                v
                [ SubtleCrypto: AES-256-GCM Decrypt ]
                                |
                                v
                [ Verify SHA-256 Checksum against Metadata ]
                                |
                                v
                [ Generate Ephemeral In-Memory Blob URL ]
                                |
                +---------------+---------------+
                |                               |
                v                               v
       [ In-Browser Preview ]          [ Save to Device Stream ]
```

---

## Tech Stack

| Domain | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19.2, TypeScript 5.9 | Reactive UI, strict type validation |
| **Build & Tooling** | CRACO, Webpack 5, Babel | Production bundling, polyfill handling |
| **Cryptography** | Web Crypto API (`window.crypto.subtle`) | Client-side AES-256-GCM, PBKDF2, SHA-256 |
| **Web3 & Blockchain** | Ethers.js v6, Base EVM | Wallet connection (MetaMask, Coinbase Wallet) |
| **Storage & Pinning** | IPFS, Pinata Cloud SDK & APIs | Decentralized content addressing & cloud persistence |
| **Local Storage** | IndexedDB API, Web Storage API | Persistent binary caching & blacklist registries |
| **Smooth Scroll** | Lenis Scroll Engine | Momentum-based physics scrolling |
| **Iconography** | Iconify React (`iconamoon`), Lucide React | Modular SVG vector rendering |
| **Testing** | Jest, React Testing Library, ts-node | Automated cryptographic & utility test suites |

---

## Project Directory Structure

```text
destorage/
├── config/                 # CRACO & Webpack build configurations
├── crypto/                 # Cryptographic engines & cross-device sync services
│   ├── encryptionEngine.ts # AES-256-GCM, PBKDF2, SHA-256, hex serializers
│   └── vaultSyncService.ts # Sync protocol & wallet-scoped state persistence
├── ipfs/                   # Decentralized storage client & gateway fallbacks
│   └── ipfsService.ts      # Pinata XHR upload, unpin API, IndexedDB cache
├── landingpage/            # Hero section, feature matrices, architecture visualizer
│   ├── LandingPage.tsx
│   └── LandingPage.css
├── public/                 # Favicons, Web App Manifest, static assets
│   ├── apple-touch-icon.png
│   ├── favicon.ico         # Multi-size Windows ICO (16x16, 32x32, 48x48, 64x64)
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── index.html          # SEO tags, theme-color, OpenGraph metadata
│   ├── logo192.png
│   ├── logo512.png
│   └── manifest.json       # PWA specification
├── src/                    # Application root & integration tests
│   ├── App.tsx             # Lenis scroll setup, dynamic routing & title engine
│   ├── App.css             # Global viewport styles & smooth transitions
│   ├── crypto.test.ts      # Automated Jest suite for crypto engine
│   ├── index.js            # React DOM entrypoint
│   └── react-app-env.d.ts  # Global TypeScript module declarations
├── types/                  # Shared enterprise TypeScript interface definitions
│   └── index.ts            # VaultFileItem, EncryptedPayload, IpfsResult
├── utils/                  # Formatters, address truncators, CID parsers
│   └── formatters.ts
├── vault/                  # Main Vault Dashboard & UI subsystems
│   ├── VaultDashboard.tsx  # Upload dropzone, file explorer, modal controllers
│   └── VaultDashboard.css  # Futuristic radar styling, selection physics
├── package.json
└── tsconfig.json
```

---

## Environment Configuration

Create a `.env` file in the root directory:

```env
# Pinata IPFS Cloud API Authentication
REACT_APP_PINATA_JWT=your_pinata_jwt_token_here

# Dedicated IPFS Gateway (without trailing slash)
REACT_APP_PINATA_GATEWAY=https://your-custom-gateway.mypinata.cloud

# Optional: Base EVM RPC Configuration
REACT_APP_BASE_RPC_URL=https://sepolia.base.org
```

> **Note:** If no Pinata JWT is configured, DeStorage automatically falls back to local IndexedDB content-addressed storage for offline development.

---

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/sanketpadhyal/DeStorage.git
cd DeStorage/destorage
```

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Launch Development Server
```bash
npm start
```
The application will launch on `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
```
Generates an optimized static bundle in the `build/` directory ready for deployment on decentralized hosting (IPFS, Fleek, Vercel, Cloudflare Pages).

---

## Testing & Quality Assurance

Run the automated cryptographic and unit test suite:

```bash
npm test -- --watchAll=false
```

Run static type checking across the entire TypeScript codebase:

```bash
npx tsc --noEmit
```

---

## Security Model

1. **Envelope Encryption & Key Isolation**: Raw AES-256 decryption keys never leave browser memory. Before cloud pinning, every file key is encrypted (wrapped) with a Master Key derived from the user's wallet signature via PBKDF2 (120,000 rounds). Pinata, IPFS nodes, and network observers possess zero plaintext keys.
2. **Client Isolation**: All plaintext data is discarded from JavaScript execution context once encrypted. Plaintext is never saved to `localStorage` or transmitted across the wire.
3. **Deterministic Cryptographic Verification**: Every downloaded ciphertext is verified against its pre-encryption SHA-256 hash prior to presenting the decrypted payload.
4. **No Private Key Custody**: DeStorage never manages, requests, or stores wallet private keys. Signatures are delegated exclusively to standard EIP-1193 wallet providers.
5. **CORS Sanitization**: IPFS gateway requests for ciphertext omit authorization headers to prevent cross-origin preflight leaks.

---

## License

Distributed under the [MIT License](LICENSE). Open-source, auditable, and sovereign.
