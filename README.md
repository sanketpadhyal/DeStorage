# DeStorage

> **Your files. Your keys. Your ownership.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Encryption](https://img.shields.io/badge/Encryption-AES--256--GCM-green)](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)
[![Storage](https://img.shields.io/badge/Storage-IPFS-teal)](https://ipfs.tech)
[![Blockchain](https://img.shields.io/badge/Blockchain-Base%20Sepolia-blue)](https://base.org)

**DeStorage** is a privacy-focused decentralized file vault that combines **client-side encryption**, **IPFS-compatible decentralized storage**, and **blockchain-based ownership & integrity records**.

**Website:** [destorage.sanketpadhyal.in](https://destorage.sanketpadhyal.in)

---

## Core Highlights

* **Encrypt First, Upload Second:** Files are encrypted locally in your browser using standard AES-256-GCM via the Web Crypto API before anything leaves your device.
* **Decentralized Storage:** Encrypted ciphertexts are stored on content-addressed IPFS infrastructure, producing unique cryptographic CIDs.
* **Verifiable EVM Ownership:** File registration, cryptographic CIDs, timestamps, and ownership proofs are permanently verified on EVM networks (Base Sepolia).
* **Zero-Knowledge to Storage & Backend:** No unencrypted data or private keys ever touch centralized servers or blockchain layers.
* **Decentralized Sharing:** Securely share encrypted files using public-key cryptography and key wrapping without exposing master keys.

---

## Architecture & Flow

```text
User selects file
       ↓
Validate file in browser
       ↓
Generate secure random AES-256 key (crypto.getRandomValues)
       ↓
Encrypt file locally (AES-256-GCM)
       ↓
Upload encrypted ciphertext to IPFS
       ↓
Receive IPFS CID (bafy...)
       ↓
Register file metadata & CID on Base Sepolia
       ↓
Decrypted locally in browser on retrieval
```

---

## Tech Stack

* **Frontend:** React, Vite, TypeScript, Tailwind CSS, Lucide Icons
* **Web3 Integration:** Wagmi, Viem, Base Sepolia EVM
* **Cryptography:** Native Browser Web Crypto API (SubtleCrypto, AES-256-GCM)
* **Storage Layer:** IPFS Pinning Provider (pluggable `StorageService` abstraction)
* **Smart Contracts:** Solidity (Hardhat / Foundry)

---

## Repository Structure

```text
DeStorage/
├── frontend/              # React + Vite + TypeScript web application
│   ├── src/
│   │   ├── components/    # Reusable UI components & vault widgets
│   │   ├── pages/         # Landing, Dashboard, Vault, Settings
│   │   ├── services/      # Encryption, IPFS, and Blockchain services
│   │   ├── hooks/         # Custom React hooks (wallet, vault, storage)
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Helpers and cryptographic primitives
├── contracts/             # Solidity smart contracts & test suites
│   ├── src/               # DeStorageRegistry.sol
│   └── test/              # Contract unit tests
└── README.md
```

---

## Quickstart

### 1. Prerequisites
- Node.js >= 18.x
- npm, pnpm, or yarn

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## License

Distributed under the [MIT License](LICENSE).
