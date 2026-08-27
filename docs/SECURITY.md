# DeStorage Security Model & Cryptographic Specification

## 1. Threat Model & Principles
DeStorage enforces a strict **Zero-Knowledge Architecture**:
- Plaintext user files never leave browser memory.
- No central server holds decryption keys or master passphrases.
- Storage nodes (IPFS gateways) only receive high-entropy AES-256-GCM ciphertexts.

## 2. Cryptographic Primitives
- **Cipher**: AES-GCM with 256-bit keys
- **Initialization Vector (IV)**: 12-byte cryptographically secure pseudorandom values (`crypto.getRandomValues`) per file
- **Key Derivation Function**: PBKDF2 with HMAC-SHA-256, 100,000 iterations, 16-byte random salt
- **Integrity Verification**: Pre-encryption and post-decryption SHA-256 integrity checksum proofs
