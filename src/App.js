import React, { useState, useEffect } from 'react';
import './App.css';
import logoImg from './assets/logo.png';
import { 
  ShieldCheck, 
  Lock, 
  UploadCloud, 
  Database, 
  HardDrive, 
  Share2, 
  Key, 
  FileText, 
  Image, 
  Video, 
  Music, 
  CheckCircle, 
  ExternalLink,
  Star,
  User,
  Search,
  Sparkles
} from 'lucide-react';

const GithubIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

function App() {
  const [activeTab, setActiveTab] = useState('vault');
  
  // Interactive Web Crypto Live Demo State
  const [demoInput, setDemoInput] = useState('My top secret financial report & family photos.');
  const [demoOutput, setDemoOutput] = useState({
    iv: '',
    ciphertext: '',
    sha256: '',
    mockCid: '',
    status: 'Ready'
  });

  // Real-time client-side Web Crypto AES-256-GCM encryption
  useEffect(() => {
    async function runLiveEncryption() {
      try {
        if (!window.crypto || !window.crypto.subtle) return;

        // 1. Generate 256-bit AES-GCM Key
        const key = await window.crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );

        // 2. Generate 12-byte random IV
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encodedText = new TextEncoder().encode(demoInput || ' ');

        // 3. Encrypt data with AES-256-GCM
        const encryptedBuf = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: iv },
          key,
          encodedText
        );

        // 4. Calculate SHA-256 Hash
        const hashBuf = await window.crypto.subtle.digest('SHA-256', encryptedBuf);
        const hashArray = Array.from(new Uint8Array(hashBuf));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // 5. Convert to Base64
        const cipherArray = Array.from(new Uint8Array(encryptedBuf));
        const ivArray = Array.from(iv);

        const ivHex = ivArray.map(b => b.toString(16).padStart(2, '0')).join('');
        const cipherHex = cipherArray.slice(0, 24).map(b => b.toString(16).padStart(2, '0')).join('') + '...';

        setDemoOutput({
          iv: `0x${ivHex}`,
          ciphertext: `${cipherHex} (${encryptedBuf.byteLength} bytes ciphertext)`,
          sha256: `0x${hashHex.slice(0, 32)}...`,
          mockCid: `bafybeig${hashHex.slice(0, 16)}7h9d4w`,
          status: 'Encrypted via Web Crypto API (AES-256-GCM)'
        });
      } catch (err) {
        console.error('Demo crypto error:', err);
      }
    }

    runLiveEncryption();
  }, [demoInput]);

  return (
    <div className="page-wrapper animate-blur-in">
      
      {/* 1. NAVBAR */}
      <nav className="card-section navbar">
        <a href="#hero" className="nav-brand">
          <img src={logoImg} alt="DeStorage Logo" className="brand-logo" />
          <div>
            <div className="brand-title">DeStorage</div>
            <span className="subdomain-tag">destorage.sanketpadhyal.in</span>
          </div>
        </a>

        <ul className="nav-links">
          <li><a href="#how-it-works" className="nav-link">How It Works</a></li>
          <li><a href="#pillars" className="nav-link">Architecture</a></li>
          <li><a href="#crypto-demo" className="nav-link">Live Crypto Demo</a></li>
          <li><a href="#comparison" className="nav-link">Comparison</a></li>
          <li><a href="#creator" className="nav-link">Developer</a></li>
        </ul>

        <div className="nav-actions">
          <a 
            href="https://github.com/sanketpadhyal/DeStorage" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-black"
          >
            <GithubIcon size={16} />
            <span>GitHub</span>
          </a>
          <a 
            href="#hero-preview" 
            className="btn btn-primary"
          >
            <ShieldCheck size={16} />
            <span>Launch Vault</span>
          </a>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <header id="hero" className="card-section hero-card">
        <div className="hero-badge">
          <div className="hero-dot"></div>
          <span>Client-Side Encrypted • IPFS Storage • Base Sepolia EVM</span>
        </div>

        <h1 className="hero-title">
          All your files in one <span>truly private</span> decentralized vault.
        </h1>

        <p className="hero-desc">
          <strong>DeStorage</strong> combines browser-native <strong>AES-256-GCM encryption</strong>, <strong>IPFS decentralized storage</strong>, and <strong>Base Sepolia smart contracts</strong>. Your plaintext files never touch any centralized servers or blockchains.
        </p>

        <div className="hero-btn-group">
          <a href="#crypto-demo" className="btn btn-primary" style={{ padding: '13px 28px', fontSize: '15px' }}>
            <Lock size={18} />
            <span>Test Live Encryption</span>
          </a>
          <a 
            href="https://github.com/sanketpadhyal/DeStorage" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-secondary" 
            style={{ padding: '13px 28px', fontSize: '15px' }}
          >
            <GithubIcon size={18} />
            <span>View Source Code</span>
            <ExternalLink size={14} />
          </a>
        </div>

        {/* INTERACTIVE PREVIEW TABS (MATCHING USER SCREENSHOTS) */}
        <div id="hero-preview" className="preview-container">
          <div className="preview-tabs">
            <button 
              className={`preview-tab-btn ${activeTab === 'vault' ? 'active' : ''}`}
              onClick={() => setActiveTab('vault')}
            >
              <Database size={15} />
              <span>1. Main Cloud Vault</span>
            </button>
            <button 
              className={`preview-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <UploadCloud size={15} />
              <span>2. Upload & Encrypt Flow</span>
            </button>
            <button 
              className={`preview-tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              <Star size={15} />
              <span>3. Media Gallery View</span>
            </button>
            <button 
              className={`preview-tab-btn ${activeTab === 'sharing' ? 'active' : ''}`}
              onClick={() => setActiveTab('sharing')}
            >
              <Share2 size={15} />
              <span>4. Encrypted Sharing Modal</span>
            </button>
          </div>

          <div className="preview-content">
            {/* VIEW 1: MAIN VAULT */}
            {activeTab === 'vault' && (
              <div className="mock-vault-grid">
                <div className="mock-sidebar">
                  <div className="mock-user-row">
                    <div className="mock-avatar"><User size={18} /></div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px' }}>Sanket Padhyal</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>0xABCD...1234</div>
                    </div>
                  </div>
                  <div className="mock-nav-item active"><HardDrive size={14} /><span>My cloud</span></div>
                  <div className="mock-nav-item"><Share2 size={14} /><span>Shared files</span></div>
                  <div className="mock-nav-item"><Star size={14} /><span>Favorites</span></div>
                  <div className="mock-nav-item"><UploadCloud size={14} /><span>Upload files</span></div>
                </div>

                <div className="mock-center">
                  <div className="mock-search"><Search size={14} /><span>Search encrypted files, CIDs, or folders...</span></div>
                  <div className="mock-categories">
                    <div className="mock-cat-card" style={{ background: '#5b58eb' }}>
                      <Image size={16} />
                      <h4>Pictures</h4>
                      <span>480 files (Encrypted)</span>
                    </div>
                    <div className="mock-cat-card" style={{ background: '#00b4b6' }}>
                      <FileText size={16} />
                      <h4>Documents</h4>
                      <span>190 files (Encrypted)</span>
                    </div>
                    <div className="mock-cat-card" style={{ background: '#f43f75' }}>
                      <Video size={16} />
                      <h4>Videos</h4>
                      <span>30 files (Encrypted)</span>
                    </div>
                    <div className="mock-cat-card" style={{ background: '#2563eb' }}>
                      <Music size={16} />
                      <h4>Audio</h4>
                      <span>80 files (Encrypted)</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="mock-file-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                        <span style={{ color: '#5b58eb' }}>●</span> IMG_100000.png
                      </div>
                      <span style={{ color: '#10b981', fontFamily: 'monospace' }}>AES-256 ✓</span>
                      <span style={{ color: '#64748b' }}>5.1 MB</span>
                    </div>
                    <div className="mock-file-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                        <span style={{ color: '#00b4b6' }}>●</span> Project_Whitepaper.pdf
                      </div>
                      <span style={{ color: '#10b981', fontFamily: 'monospace' }}>Base Sepolia ✓</span>
                      <span style={{ color: '#64748b' }}>2.4 MB</span>
                    </div>
                  </div>
                </div>

                <div className="mock-right">
                  <div className="mock-upload-box">
                    <UploadCloud size={28} color="#2563eb" />
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>Add new files</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Auto AES-256 encrypted</span>
                  </div>
                  <div className="mock-storage-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
                      <span>Your Storage</span>
                      <span style={{ color: '#00b4b6' }}>25% Left</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>75 GB of 100 GB used</span>
                    <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: '75%', height: '100%', background: '#2563eb' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: UPLOAD PROGRESS */}
            {activeTab === 'upload' && (
              <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '20px', padding: '36px 20px', textAlign: 'center' }}>
                  <UploadCloud size={36} color="#2563eb" style={{ margin: '0 auto 10px' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Drag & drop your files here</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Files are encrypted locally in your browser before upload</p>
                  <button className="btn btn-secondary" style={{ marginTop: '14px', fontSize: '12px' }}>Choose files from your computer</button>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #edf2f7', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} color="#2563eb" />
                    <span>Upload & Encryption Pipeline</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', padding: '8px 12px', background: '#f8fafc', borderRadius: '10px' }}>
                      <span>🎵 Summer-vibes.mp3</span>
                      <span style={{ color: '#2563eb', fontWeight: 700 }}>Encrypting AES-256 (69%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', padding: '8px 12px', background: '#ecfdf5', borderRadius: '10px' }}>
                      <span>📷 Summer-vibes.jpeg (500 kb)</span>
                      <span style={{ color: '#059669', fontWeight: 700 }}>Pinned to IPFS & Verified ✓</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: MEDIA GALLERY */}
            {activeTab === 'favorites' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Encrypted Media Gallery</h3>
                  <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>All Thumbnails Decrypted In-Memory</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                  {['IMG_01', 'IMG_02', 'IMG_03', 'IMG_05', 'IMG_06', 'IMG_07', 'IMG_08', 'IMG_09'].map((img, i) => (
                    <div key={i} style={{ background: '#ffffff', border: '1px solid #edf2f7', borderRadius: '14px', overflow: 'hidden', padding: '8px' }}>
                      <div style={{ height: '75px', background: `linear-gradient(135deg, ${i % 2 === 0 ? '#5b58eb' : '#00b4b6'} 0%, #0b2447 100%)`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <Image size={24} />
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '6px' }}>{img}.jpg</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>Aug 27, 2026</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 4: ENCRYPTED SHARING */}
            {activeTab === 'sharing' && (
              <div style={{ maxWidth: '520px', margin: '0 auto', width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                    <Share2 size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Zero-Knowledge File Sharing</h3>
                    <p style={{ fontSize: '11.5px', color: '#64748b' }}>Recipient decrypts using wrapped public-key exchange</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Recipient Wallet Address / ENS</label>
                    <input 
                      type="text" 
                      defaultValue="0x71C...b89A (bob.eth)" 
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'monospace', marginTop: '4px' }} 
                      readOnly 
                    />
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #edf2f7', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#64748b' }}>Access Permission:</span>
                      <span style={{ fontWeight: 700, color: '#059669' }}>Read & Decrypt Only</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Master Key Exposed:</span>
                      <span style={{ fontWeight: 700, color: '#059669' }}>Never (Wrapped RSA/ECDH)</span>
                    </div>
                  </div>

                  <button className="btn btn-primary" style={{ width: '100%', marginTop: '6px' }}>
                    <Key size={15} />
                    <span>Authorize & Grant Key</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="card-section" style={{ padding: '44px 36px' }}>
        <div className="section-header">
          <span className="section-tag">Security Architecture</span>
          <h2 className="section-heading">How DeStorage Works</h2>
          <p className="section-subheading">
            Strict "Encrypt first, upload second" model. Plaintext files never reach our storage layer or blockchain.
          </p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">01</div>
            <Lock size={22} color="#5b58eb" />
            <h3 className="step-title">Client-Side Encryption</h3>
            <p className="step-desc">
              Your browser generates a 256-bit AES-GCM key and encrypts the file locally with secure random IVs before any network request.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">02</div>
            <UploadCloud size={22} color="#00b4b6" />
            <h3 className="step-title">Decentralized IPFS</h3>
            <p className="step-desc">
              Only the encrypted ciphertext is pinned to IPFS nodes, generating an immutable, content-addressed CID (bafy...).
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">03</div>
            <Database size={22} color="#f43f75" />
            <h3 className="step-title">Base Sepolia Registry</h3>
            <p className="step-desc">
              The CID, owner address, SHA-256 integrity hash, and timestamp are registered on an EVM smart contract for verifiable ownership.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">04</div>
            <CheckCircle size={22} color="#2563eb" />
            <h3 className="step-title">Local Decryption</h3>
            <p className="step-desc">
              On file retrieval, the browser downloads the ciphertext and decrypts it in-memory using your private key for zero-knowledge privacy.
            </p>
          </div>
        </div>
      </section>

      {/* 4. LIVE INTERACTIVE WEB CRYPTO DEMO */}
      <section id="crypto-demo" className="card-section" style={{ padding: '44px 36px' }}>
        <div className="section-header">
          <span className="section-tag">Try It In Real Time</span>
          <h2 className="section-heading">Native Web Crypto Sandbox</h2>
          <p className="section-subheading">
            Type anything below. Watch your browser execute real-time AES-256-GCM encryption using native Web Crypto APIs.
          </p>
        </div>

        <div className="crypto-sandbox">
          <div className="sandbox-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="#38bdf8" />
              <span style={{ fontWeight: 700, fontSize: '14px' }}>SubtleCrypto // AES-256-GCM Engine</span>
            </div>
            <span style={{ color: '#34d399', fontSize: '12px', fontFamily: 'monospace' }}>● Live Execution</span>
          </div>

          <div className="sandbox-grid">
            <div className="sandbox-input-box">
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Plaintext Input (In Browser Memory Only):</label>
              <textarea 
                value={demoInput} 
                onChange={(e) => setDemoInput(e.target.value)}
                placeholder="Type your sensitive file text here..."
              />
            </div>

            <div className="sandbox-output-box">
              <div className="sandbox-line">
                <span className="sandbox-label">1. Random Initialization Vector (IV):</span>
                <span className="sandbox-val">{demoOutput.iv}</span>
              </div>
              <div className="sandbox-line">
                <span className="sandbox-label">2. Encrypted Ciphertext Output:</span>
                <span className="sandbox-val">{demoOutput.ciphertext}</span>
              </div>
              <div className="sandbox-line">
                <span className="sandbox-label">3. SHA-256 Integrity Checksum:</span>
                <span className="sandbox-val">{demoOutput.sha256}</span>
              </div>
              <div className="sandbox-line">
                <span className="sandbox-label">4. Generated IPFS CID:</span>
                <span className="sandbox-val" style={{ color: '#34d399' }}>{demoOutput.mockCid}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 4 CATEGORY PILLARS */}
      <section id="pillars" className="card-section" style={{ padding: '44px 36px' }}>
        <div className="section-header">
          <span className="section-tag">Core Capabilities</span>
          <h2 className="section-heading">Built for All File Types</h2>
          <p className="section-subheading">
            Privacy protection tailored for photos, legal documents, video streams, and audio archives.
          </p>
        </div>

        <div className="pillars-grid">
          <div className="pillar-card pillar-purple">
            <Image size={28} />
            <div>
              <h3 className="pillar-title">Pictures & Photos</h3>
              <p className="pillar-desc">In-browser thumbnail generation and client-side decrypt previews.</p>
            </div>
          </div>

          <div className="pillar-card pillar-teal">
            <FileText size={28} />
            <div>
              <h3 className="pillar-title">Documents & PDFs</h3>
              <p className="pillar-desc">Zero-knowledge storage for legal, financial, and confidential documents.</p>
            </div>
          </div>

          <div className="pillar-card pillar-pink">
            <Video size={28} />
            <div>
              <h3 className="pillar-title">Videos & Media</h3>
              <p className="pillar-desc">Chunked streaming architecture supporting large multi-megabyte payloads.</p>
            </div>
          </div>

          <div className="pillar-card pillar-blue">
            <Music size={28} />
            <div>
              <h3 className="pillar-title">Audio & Sound</h3>
              <p className="pillar-desc">Encrypted audio archives with wallet-to-wallet decentralized sharing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. COMPARISON MATRIX */}
      <section id="comparison" className="card-section" style={{ padding: '44px 36px' }}>
        <div className="section-header">
          <span className="section-tag">Why DeStorage?</span>
          <h2 className="section-heading">Traditional Cloud vs. DeStorage</h2>
          <p className="section-subheading">
            See the concrete security and privacy differences between centralized big tech and our decentralized vault.
          </p>
        </div>

        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Traditional Cloud (Google / Dropbox)</th>
                <th style={{ color: '#166534' }}>DeStorage Vault (Web3 + Crypto)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Encryption Location</strong></td>
                <td>Server-side (Company holds decryption keys)</td>
                <td className="destorage-col">Client-side (Keys generated in browser)</td>
              </tr>
              <tr>
                <td><strong>Plaintext Visibility</strong></td>
                <td>Readable by employees, AI scanners & subpoenas</td>
                <td className="destorage-col">Zero-Knowledge (Never leaves your device)</td>
              </tr>
              <tr>
                <td><strong>Storage Provider</strong></td>
                <td>Single centralized corporate server</td>
                <td className="destorage-col">IPFS Content-Addressed Network</td>
              </tr>
              <tr>
                <td><strong>Ownership Proof</strong></td>
                <td>Corporate user database record</td>
                <td className="destorage-col">Base Sepolia EVM Smart Contract</td>
              </tr>
              <tr>
                <td><strong>Data Integrity</strong></td>
                <td>Provider-dependent checksum</td>
                <td className="destorage-col">Immutable cryptographic CID + On-Chain Hash</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. CREATOR SECTION */}
      <section id="creator" className="card-section" style={{ padding: '44px 36px' }}>
        <div className="section-header">
          <span className="section-tag">Behind The Project</span>
          <h2 className="section-heading">Meet the Creator</h2>
        </div>

        <div className="creator-box">
          <div className="creator-avatar">
            SP
          </div>

          <div className="creator-info">
            <h3 className="creator-name">Sanket Padhyal</h3>
            <p className="creator-bio">
              Full Stack & Web3 Developer building privacy-first decentralized applications and on-device AI tools. DeStorage was built with the conviction that user files and cryptographic keys must remain strictly in the hands of the individual.
            </p>

            <div className="creator-links">
              <a 
                href="https://sanketpadhyal.in" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-black"
              >
                <User size={15} />
                <span>Portfolio: sanketpadhyal.in</span>
                <ExternalLink size={13} />
              </a>

              <a 
                href="https://github.com/sanketpadhyal" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-secondary"
              >
                <GithubIcon size={15} />
                <span>GitHub: @sanketpadhyal</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="card-section footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={logoImg} alt="DeStorage" style={{ width: '28px', height: '28px', borderRadius: '8px' }} />
          <div>
            <strong>DeStorage</strong> • Your files. Your keys. Your ownership.
          </div>
        </div>

        <div>
          MIT License • Built on <a href="https://base.org" target="_blank" rel="noopener noreferrer">Base Sepolia</a> & <a href="https://ipfs.tech" target="_blank" rel="noopener noreferrer">IPFS</a>
        </div>
      </footer>

    </div>
  );
}

export default App;
