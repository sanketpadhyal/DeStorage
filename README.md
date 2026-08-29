<p align="center">
  <img src="public/logo.png" alt="DeStorage Logo" width="110" height="110" style="border-radius: 22px;" />
</p>

<h1 align="center">DeStorage</h1>

<p align="center">
  <strong>Sovereign Web3 & Decentralized Zero-Knowledge Storage Platform</strong><br>
  <em>Client-Side AES-256-GCM Encryption • PBKDF2 Master Key Wrapping • Hierarchical Folder Explorer • Decentralized IPFS Storage • Base Sepolia Blockchain Anchoring</em>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black" alt="React" /></a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto"><img src="https://img.shields.io/badge/Cryptography-AES--256--GCM-059669" alt="Cryptography" /></a>
  <a href="https://ipfs.tech"><img src="https://img.shields.io/badge/Storage-IPFS%20Network-0284C7?logo=ipfs&logoColor=white" alt="Storage" /></a>
  <a href="https://base.org"><img src="https://img.shields.io/badge/Network-Base%20Sepolia%20EVM-0052FF?logo=coinbase&logoColor=white" alt="Blockchain" /></a>
</p>

**DeStorage** is a high-performance, non-custodial decentralized storage platform. It bridges native in-browser **AES-256-GCM** envelope encryption with the **InterPlanetary File System (IPFS)** and **Base Sepolia Ethereum L2** smart contracts. All cryptographic operations execute strictly inside volatile browser memory (`SubtleCrypto`), guaranteeing zero-knowledge privacy: plaintext data, private keys, and seed phrases never leave your local device.

---

## Table of Contents

- [Architectural Overview & Graph Tree](#architectural-overview--graph-tree)
- [Hierarchical Folder & Directory System](#hierarchical-folder--directory-system)
- [5-Stage Cryptographic Lifecycle](#5-stage-cryptographic-lifecycle)
- [Wallet Permission & Decryption Verification Flow](#wallet-permission--decryption-verification-flow)
- [Security Comparison: DeStorage vs Centralized Cloud](#security-comparison-destorage-vs-centralized-cloud)
- [Decentralized Storage & Pinata Protocol](#decentralized-storage--pinata-protocol)
- [System Data Flows](#system-data-flows)
- [Tech Stack](#tech-stack)
- [Project Directory Structure](#project-directory-structure)
- [Environment Configuration](#environment-configuration)
- [Getting Started](#getting-started)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Security Guarantees & Verification](#security-guarantees--verification)
- [License](#license)

---

## Architectural Overview & Graph Tree

```text
=============================================================================================
                                DESTORAGE ARCHITECTURAL GRAPH TREE
=============================================================================================

 [ 1. USER DEVICE (CLIENT-SIDE) ]
   │
   ├─► [ MetaMask / Coinbase Wallet ] ──(EIP-191 Signature)──► [ PBKDF2 Key Derivation ]
   │                                                             • 120,000 SHA-256 Iterations
   │                                                             • Wallet Address Salt
   │                                                             • 256-Bit Master Key (RAM Only)
   │
   ├─► [ File & Folder Ingestion Engine ]
   │     • Standalone Files (Photos, PDFs, Audio, Video, Archives)
   │     • Recursive Directory Traversal (HTML5 webkitdirectory & webkitGetAsEntry)
   │     • Relative Path Preservation (folder/subfolder/file.ext)
   │     • Batch Client-Side Queue Processing (Up to 30 files per directory batch)
   │     │
   │     ▼
   ├─► [ Web Cryptography API (SubtleCrypto) ]
   │     • Ephemeral 256-Bit AES Key (DEK) via crypto.getRandomValues(32)
   │     • Unique 96-Bit Initialization Vector (IV) via crypto.getRandomValues(12)
   │     • AES-256-GCM AEAD In-Place Binary Encryption -> Authenticated Ciphertext
   │     • SHA-256 Checksum Hash Calculation (Tamper-Proof Verification)
   │
   └─► [ Envelope Key Wrapping Engine ]
         • MasterKey Encrypts FileKey (DEK) using dedicated Wrap IV (kiv)
         • Wrapped Key Ciphertext generated (Raw key purged from long-term memory)
         • Zero Plaintext Bytes on Wire (100% Ciphertext Payload)

                                         │
                                         ▼ (Encrypted Binary + Wrapped Key Metadata)

 [ 2. DECENTRALIZED IPFS NETWORK (PINATA CLOUD) ]
   │
   ├─► [ Pinata v3 Files API & v2 Pinning Fallback ]
   │     • Immutable Content-Addressed CIDv1 (bafkrei...)
   │     • Dual-Pinning Architecture: Public Network Distribution + Global Gateway Swarm
   │     • Scoped Metadata Keyvalues (<= 9 Keys strictly compliant with Pinata 10-key limit):
   │       [ app, owner, name, mime, size, key(wrapped), iv, kiv, sha ]
   │
   └─► [ Multi-Gateway Resilience Chain ]
         • Primary: Dedicated IPFS Gateway (REACT_APP_PINATA_GATEWAY)
         • Secondary: https://gateway.pinata.cloud/ipfs/{cid}
         • Tertiary: Global Public Gateways (ipfs.io, cloudflare-ipfs.com)

                                         │
                                         ▼ (Immutable CID & SHA-256 Checksum)

 [ 3. BASE SEPOLIA ETHEREUM L2 BLOCKCHAIN ]
   │
   └─► [ DeStorageRegistry.sol Smart Contract ]
         • Sovereign non-custodial ownership registration
         • Immutable on-chain timestamps & CID anchoring
         • Censorship-resistant identity verified by EVM address

                                         │
                                         ▼ (Cross-Device Viewing & Retrieval)

 [ 4. ZERO-KNOWLEDGE RAM DECRYPTION & MEDIA STREAMING ]
   │
   ├─► Interactive Signature Authorization ──► Wallet Live Checking Radar State
   ├─► Stream Ciphertext from IPFS ──► Verify against SHA-256 Checksum
   ├─► Unwrap File Key via Master Key ──► AES-256-GCM Decrypt in Volatile Memory
   └─► Instant In-Memory Blob URL Previews ──► Zero Disk Traces Left on Logout
=============================================================================================
```

---

## Hierarchical Folder & Directory System

DeStorage features a full directory management architecture designed for codebases, backups, and nested collections:

1. **Recursive Client-Side Traversal**:
   - **Upload Folder**: Uses HTML5 `webkitdirectory` and `directory` attributes to ingest entire directory trees.
   - **Drag & Drop Folders**: Implements recursive filesystem traversal using `DataTransferItemList.webkitGetAsEntry()` and `FileSystemDirectoryReader.readEntries()`.
   - **Relative Path Preservation**: Retains folder structure in client memory (e.g. `my-project/assets/image.png`).

2. **Hierarchical Directory Cards & Drill-Down**:
   - **Root Overview**: Files belonging to a directory are grouped into **Folder Directory Cards** showing total file count, aggregate folder byte size, and encryption specifications.
   - **Drill-Down Explorer**: Clicking **Open** drills into the folder, presenting an interactive breadcrumb header (`All Files / folder-name`) and isolated inner file views.
   - **Standalone File Isolation**: Files outside folders remain neatly displayed in the root overview.
   - **Folder-Level Batch Deletion**: One-click folder removal removes all contained files in state and asynchronously unpins their CIDs from IPFS.

---

## 5-Stage Cryptographic Lifecycle

Every file processed by DeStorage passes through an auditable, multi-stage cryptographic pipeline executed via standard W3C Web Cryptography primitives (`window.crypto.subtle`):

### Stage 1: Deterministic Master Key Derivation
- **Trigger**: The user signs a deterministic cryptographic challenge with MetaMask:
  ```text
  Sign to unlock your DeStorage Master Vault Key: 0x...
  ```
- **Derivation Function**: The signature bytes are passed to **PBKDF2-HMAC-SHA256** with **120,000 iterations** and a wallet-bound salt:
  ```text
  salt = "DeStorage_Master_Key_Salt_" + walletAddress.toLowerCase()
  MasterKey = PBKDF2(Signature, salt, iterations=120000, hash="SHA-256", length=256)
  ```
- **Security**: The Master Key exists only in volatile browser RAM during the active session. Closing the tab immediately purges it.

### Stage 2: Client-Side AES-256-GCM File Encryption
- **Ephemeral Key Generation**: For every individual file, the engine generates an independent 256-bit AES-GCM data key (`DEK`) and a 96-bit random initialization vector (`IV`):
  ```text
  fileKey = window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])
  iv = window.crypto.getRandomValues(new Uint8Array(12))
  ```
- **Authenticated Cipher**: Encrypts the raw file buffer using Galois/Counter Mode (GCM), generating ciphertext with an authenticated 128-bit AEAD tag:
  ```text
  ciphertext = AES-GCM-Encrypt(fileKey, iv, plaintextBuffer)
  ```

### Stage 3: Envelope Key Wrapping & SHA-256 Checksum
- **Key Wrapping**: The ephemeral file key (`fileKey`) is wrapped using the user's `MasterKey` with a distinct wrapping IV (`kiv`):
  ```text
  wrapIv = window.crypto.getRandomValues(new Uint8Array(12))
  wrappedKeyCiphertext = AES-GCM-Encrypt(MasterKey, wrapIv, rawFileKeyBytes)
  ```
- **Tamper-Proof Integrity**: A deterministic SHA-256 hash of the ciphertext is computed and stored in metadata:
  ```text
  sha256Hash = SHA-256(ciphertext)
  ```
- **Zero-Knowledge Guarantee**: Only `wrappedKeyCiphertext` and `wrapIv` are attached to IPFS metadata. Pinata, IPFS nodes, and network observers **never see or hold the raw decryption key**.

### Stage 4: Decentralized IPFS Storage
- **CIDv1 Addressing**: The encrypted ciphertext is pinned directly to IPFS, generating a unique content-addressed hash (e.g. `bafkrei...`).
- **Pinata v3 Files API**: Uploaded with `network: "public"`, ensuring files are globally distributed across IPFS gateway nodes.

### Stage 5: Base Sepolia Blockchain Anchoring & 1-Signature Decryption
- **Smart Contract Verification**: The file's CID and SHA-256 integrity hash can be immutably recorded on the `DeStorageRegistry` smart contract on Base Sepolia.
- **Session Decryption**: On any device, **only 1 signature** is required per session to derive the Master Key. All vault items automatically decrypt in RAM upon request.

---

## Wallet Permission & Decryption Verification Flow

When previewing an encrypted file without an unlocked session Master Key:
1. **Interactive Permission Prompt**: The preview modal opens instantly with a clean cryptographic summary (`PBKDF2 Master Key`, `120,000 Rounds`, `Free (0 Gas Fee)`).
2. **Live Checking Radar**: Triggering **"Ask for Permission"** requests a wallet signature and displays an animated radar checking indicator.
3. **Verified Confirmation**: Upon signature approval, an animated green confirmation tick confirms the derivation.
4. **In-Memory Streaming**: The ciphertext is downloaded, unwrapped via Master Key, decrypted in RAM, and streamed as an ephemeral blob URL.

---

## Security Comparison: DeStorage vs Centralized Cloud

| Security Feature | DeStorage Vault | Google Drive / Photos | Dropbox / Apple iCloud |
| :--- | :--- | :--- | :--- |
| **Encryption Layer** | **Client-Side AES-256-GCM** (On-Device) | Server-Side (Company holds keys) | Server-Side (Company holds keys) |
| **Master Key Custody** | **Non-Custodial** (Web3 Wallet Signature) | Custodial (Google account passwords) | Custodial (Apple/Dropbox servers) |
| **Folder & File Privacy** | **100% Zero-Knowledge** (Encrypted in RAM) | Plaintext Directory Indexing | Plaintext Directory Indexing |
| **AI Data Scanning / Scraping** | **Mathematically Impossible** (0 Plaintext Bytes) | Yes (Scanned for AI training & ads) | Yes (Scanned for content indexing) |
| **File Integrity & Tampering** | **SHA-256 + IPFS CIDv1 + Blockchain** | Mutable Central Database | Mutable Central Database |
| **Censorship & Account Lockout** | **0% Risk** (Decentralized P2P Network) | High (Suspension locks all files) | High (Suspension locks all files) |
| **Server Plaintext Exposure** | **0 KB** (Zero-Knowledge Architecture) | 100% of files stored in plaintext | 100% of files stored in plaintext |

---

## Decentralized Storage & Pinata Protocol

DeStorage utilizes a dual-layer caching and pinning strategy:

1. **Persistent Binary Storage (IndexedDB)**:
   - Encrypted ArrayBuffers are cached in client IndexedDB (`destorage_ipfs_db / encrypted_payloads`).
   - Enables instantaneous offline file decryption and preview without redundant network requests.

2. **Decentralized IPFS Metadata Specification**:
   - Pinned objects carry sovereign metadata keyvalues strictly limited to **<= 9 keys** to comply with Pinata's strict 10-key limit:
     ```json
     {
       "app": "DeStorage",
       "owner": "0xf026b53867f21b1f9c416b263b4995624e6c5b0c",
       "name": "my-project/financial_report.pdf",
       "mime": "application/pdf",
       "size": "1048576",
       "key": "4a7f28... (wrapped key ciphertext hex)",
       "iv": "3c8a91... (file IV hex)",
       "kiv": "9f182c... (key wrap IV hex)",
       "sha": "e3b0c4... (SHA-256 checksum)"
     }
     ```

3. **CORS-Compliant Gateway Fallback Chain**:
   - Primary: Dedicated custom IPFS gateway (`REACT_APP_PINATA_GATEWAY`).
   - Secondary: `https://gateway.pinata.cloud/ipfs/{cid}`.
   - Tertiary: Public IPFS gateways (`https://ipfs.io/ipfs/{cid}`, `https://cloudflare-ipfs.com/ipfs/{cid}`).

---

## System Data Flows

### Upload & Key Wrapping Pipeline
```text
[ User Selects File or Folder ]
       │
       ▼
[ Recursive Traversal & Relative Path Extraction ]
       │
       ▼
[ Web Crypto API: Generate DEK (256-bit) + IV (96-bit) ]
       │
       ▼
[ AES-256-GCM In-Place Binary Encryption ] ──► [ Compute SHA-256 Checksum ]
       │
       ▼
[ PBKDF2 Master Key Wraps DEK with Wrap IV (kiv) ]
       │
       ▼
[ XHR Stream to Pinata IPFS (uploads.pinata.cloud/v3/files) ]
       │
       ├─► Live onprogress Tracking (MB/s speed & dynamic ETA)
       │
       ▼
[ IPFS Node Returns CIDv1 (bafkrei...) ]
       │
       ├─► Cache Ciphertext to Local IndexedDB
       ├─► Update Local Vault State & Folder Hierarchies
       └─► Anchor to Base Sepolia Smart Contract
```

### Retrieval & In-Memory Decryption Pipeline
```text
[ User Requests Preview / Download ]
       │
       ▼
[ Check Master Key in RAM ]
       ├── Locked ───► Prompt "Ask for Permission" (Signature Live Check Radar)
       └── Unlocked ─► Proceed to Fetch
                             │
                             ▼
[ Check IndexedDB Binary Cache ]
       ├── Found ──────► Read Encrypted ArrayBuffer from Memory
       └── Not Found ──► Stream Ciphertext from IPFS Gateway
                                │
                                ▼
               [ Unwrap File Key via Master Key (kiv) ]
                                │
                                ▼
               [ SubtleCrypto: AES-256-GCM Decrypt ]
                                │
                                ▼
               [ Verify SHA-256 Checksum against Metadata ]
                                │
                                ▼
               [ Generate Ephemeral In-Memory Blob URL ]
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
       [ In-Browser Preview ]          [ Save to Device Stream ]
```

---

## Tech Stack

| Domain | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19.2, TypeScript 5.9 | Reactive UI, strict type safety |
| **Build & Tooling** | CRACO, Webpack 5, Babel | Production bundling, polyfill handling |
| **Cryptography** | Web Crypto API (`window.crypto.subtle`) | Client-side AES-256-GCM, PBKDF2, SHA-256 |
| **Directory Ingestion** | HTML5 `webkitdirectory`, FileSystem API | Recursive folder traversal & batch queueing |
| **Web3 & Blockchain** | Ethers.js v6, Base Sepolia EVM | Non-custodial wallet connection & smart contracts |
| **Decentralized Storage** | IPFS, Pinata v3 Files API & v2 Pinning | Content-addressed storage & global gateway pinning |
| **Local Persistence** | IndexedDB API, Web Storage API | Binary ciphertext cache & offline fallback |
| **Smooth Scrolling** | Lenis Scroll Engine | Momentum-based physics scrolling |
| **Iconography** | Iconify React, Lucide React | Modular SVG vector rendering |
| **Testing** | Jest, React Testing Library, ts-node | Automated cryptographic & utility test suites |

---

## Project Directory Structure

```text
destorage/
├── config/                 # CRACO & Webpack build configurations
├── contracts/              # Solidity smart contracts for Base Sepolia
│   └── DeStorageRegistry.sol # Immutable CID & ownership proof registry
├── crypto/                 # Cryptographic engines & envelope key wrappers
│   ├── encryptionEngine.ts # AES-256-GCM, PBKDF2, SHA-256, hex serializers
│   ├── envelopeEncryption.ts # Master key derivation & key wrapping logic
│   └── vaultSyncService.ts # Sync protocol & wallet-scoped state persistence
├── hover/                  # Universal interactive hover physics & button rules
│   └── universalhover.css
├── ipfs/                   # Decentralized storage client & gateway fallbacks
│   └── ipfsService.ts      # Pinata v3/v2 XHR upload, unpin API, IndexedDB cache
├── landingpage/            # Hero section, 5-stage graph tree, feature matrices
│   ├── LandingPage.tsx
│   └── LandingPage.css
├── public/                 # Favicons, Web App Manifest, static assets
│   ├── apple-touch-icon.png
│   ├── favicon.ico
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── index.html
│   ├── logo192.png
│   ├── logo512.png
│   └── manifest.json
├── src/                    # Application root & integration tests
│   ├── App.tsx             # Lenis scroll setup, dynamic routing & title engine
│   ├── App.css
│   ├── crypto.test.ts      # Automated Jest suite for crypto engine (8/8 pass)
│   ├── index.css           # Root CSS custom variables & typography
│   ├── index.js            # React DOM entrypoint
│   └── react-app-env.d.ts
├── types/                  # Shared enterprise TypeScript interface definitions
│   └── index.ts            # VaultFileItem, EncryptedPayload, IpfsResult
├── utils/                  # Formatters, address truncators, CID parsers
│   └── formatters.ts
└── vault/                  # Main Vault Dashboard & UI subsystems
    ├── VaultDashboard.tsx  # Folder explorer, batch uploader, permission radar
    └── VaultDashboard.css  # Futuristic folder cards, breadcrumb bar, glass modals
```

---

## Environment Configuration

Create a `.env` file in the root directory:

```env
# Pinata IPFS Cloud API Authentication (Stored securely, never rendered in client UI)
REACT_APP_PINATA_JWT=your_pinata_jwt_token_here
REACT_APP_PINATA_API_KEY=your_pinata_api_key
REACT_APP_PINATA_SECRET_API_KEY=your_pinata_secret_key

# Dedicated IPFS Gateway (without trailing slash)
REACT_APP_PINATA_GATEWAY=gateway.pinata.cloud

# Base Sepolia Ethereum L2 RPC Configuration
REACT_APP_BASE_SEPOLIA_RPC=https://sepolia.base.org
```

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

Run the automated cryptographic test suite:
```bash
CI=true npm test
```

Run static type checking across the entire TypeScript codebase:
```bash
npx tsc --noEmit
```

---

## Security Guarantees & Verification

1. **Zero Server Knowledge**: Encryption keys are derived client-side in volatile memory via PBKDF2 (120,000 iterations). Servers and network observers receive only ciphertext.
2. **Envelope Security**: Raw AES-256 keys never touch storage nodes. Every file key is double-encrypted with your wallet's Master Key before upload.
3. **Hierarchical Directory Isolation**: Directory structures are processed client-side without plaintext path leaks.
4. **Deterministic Verification**: Ciphertext integrity is verified against pre-encryption SHA-256 checksums prior to RAM decryption.
5. **Non-Custodial Architecture**: Private keys and seed phrases never leave your wallet.
6. **Memory Sanitization**: Plaintext buffers and Master Keys reside in volatile JavaScript memory and are purged upon session termination or tab closure.

---

## License

Distributed under the [MIT License](LICENSE). Open-source, auditable, and sovereign.
