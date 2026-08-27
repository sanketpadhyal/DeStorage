import React, { useState, useEffect } from 'react';
import './LandingPage.css';
import logoImg from '../assets/logo.png';
import heroIllustration from '../assets/hero_illustration.jpg';
import featuresIllustration from '../assets/features_illustration.jpg';
import mascotCharacter from '../assets/mascot_character.jpg';

import { 
  Lock, 
  Check, 
  ExternalLink,
  ArrowRight,
  User
} from 'lucide-react';

const GithubIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

export interface LandingPageProps {
  onLaunchApp?: () => void;
}

interface CryptoDemoOutput {
  iv: string;
  ciphertext: string;
  sha256: string;
  mockCid: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  const [demoInput, setDemoInput] = useState<string>('My top-secret financial report & encrypted family photos.');
  const [demoOutput, setDemoOutput] = useState<CryptoDemoOutput>({
    iv: '',
    ciphertext: '',
    sha256: '',
    mockCid: ''
  });

  // Real-time client-side Web Crypto AES-256-GCM encryption
  useEffect(() => {
    async function runLiveEncryption() {
      try {
        if (!window.crypto || !window.crypto.subtle) return;

        const key = await window.crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );

        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encodedText = new TextEncoder().encode(demoInput || ' ');

        const encryptedBuf = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: iv },
          key,
          encodedText
        );

        const hashBuf = await window.crypto.subtle.digest('SHA-256', encryptedBuf);
        const hashArray = Array.from(new Uint8Array(hashBuf));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const cipherArray = Array.from(new Uint8Array(encryptedBuf));
        const ivArray = Array.from(iv);

        const ivHex = ivArray.map(b => b.toString(16).padStart(2, '0')).join('');
        const cipherHex = cipherArray.slice(0, 24).map(b => b.toString(16).padStart(2, '0')).join('') + '...';

        setDemoOutput({
          iv: `0x${ivHex}`,
          ciphertext: `${cipherHex} (${encryptedBuf.byteLength} bytes)`,
          sha256: `0x${hashHex.slice(0, 32)}...`,
          mockCid: `bafybeig${hashHex.slice(0, 16)}7h9d4w`
        });
      } catch (err) {
        console.error('Demo crypto error:', err);
      }
    }

    runLiveEncryption();
  }, [demoInput]);

  return (
    <div className="template-page-wrapper">
      
      {/* 0. FLOATING TOP TITLE (Matching the template presentation) */}
      <div className="template-top-title">
        <span className="template-top-sub">DeStorage</span>
        <h1 className="template-top-main">Privacy-First Decentralized Vault</h1>
      </div>

      {/* 1. HERO SECTION CARD */}
      <div className="template-card">
        {/* Inside Mini Navbar */}
        <nav className="template-nav">
          <a href="#hero" className="template-brand">
            <img src={logoImg} alt="DeStorage Logo" />
            <span>DeStorage</span>
          </a>

          <ul className="template-nav-links">
            <li><a href="#features" className="template-nav-link">Why us</a></li>
            <li><a href="#features" className="template-nav-link">Architecture</a></li>
            <li><a href="#how-it-works" className="template-nav-link">How it Works</a></li>
            <li><a href="#pricing" className="template-nav-link">Pricing</a></li>
          </ul>

          <a 
            href="https://github.com/sanketpadhyal/DeStorage" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="template-nav-btn"
          >
            GitHub Repo
          </a>
        </nav>

        {/* Hero 2-Column Content */}
        <div id="hero" className="hero-content-grid">
          <div className="hero-left">
            <h2 className="hero-main-title">
              Own your files with proper decentralized privacy
            </h2>
            <p className="hero-main-desc">
              We deliver client-side AES-256-GCM encryption combined with IPFS content addressing and Base Sepolia EVM blockchain ownership records.
            </p>
            <div className="hero-action-row">
              <button 
                onClick={onLaunchApp || (() => {
                  const el = document.getElementById('crypto-demo');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                })}
                className="btn-cyan"
              >
                <span>Launch Vault</span>
                <ArrowRight size={16} />
              </button>
              <a 
                href="https://github.com/sanketpadhyal/DeStorage" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-dark-pill"
              >
                <GithubIcon size={16} />
                <span>View Source</span>
              </a>
            </div>
          </div>

          <div className="hero-right">
            <img 
              src={heroIllustration} 
              alt="DeStorage Cloud Vault Hero Illustration" 
              className="hero-right-img" 
            />
          </div>
        </div>
      </div>

      {/* 2. NUMBERED 2x2 ARCHITECTURE EXPERTISE SECTION */}
      <div id="features" className="template-card features-section-card">
        <h3 className="features-header-title">Our deep decentralized security</h3>
        
        <div className="features-layout-grid">
          <div className="numbered-grid-2x2">
            <div className="numbered-item">
              <span className="item-num">1</span>
              <h4 className="item-heading">Client-Side Web Crypto</h4>
              <p className="item-text">
                Files are encrypted locally in your browser with AES-256-GCM before upload. Plaintext never leaves your machine.
              </p>
            </div>

            <div className="numbered-item">
              <span className="item-num">2</span>
              <h4 className="item-heading">IPFS Content Addressing</h4>
              <p className="item-text">
                Encrypted ciphertexts are pinned across decentralized IPFS nodes, generating verifiable content-addressed CIDs.
              </p>
            </div>

            <div className="numbered-item">
              <span className="item-num">3</span>
              <h4 className="item-heading">Base Sepolia Ownership</h4>
              <p className="item-text">
                File registration, immutable ownership records, and SHA-256 integrity proofs are verified permanently on-chain.
              </p>
            </div>

            <div className="numbered-item">
              <span className="item-num">4</span>
              <h4 className="item-heading">Zero-Knowledge Sharing</h4>
              <p className="item-text">
                Share files directly with wallet addresses using public-key wrapped encryption without ever exposing master keys.
              </p>
            </div>
          </div>

          <div>
            <img 
              src={featuresIllustration} 
              alt="Cryptographic Integrity & Inspection Illustration" 
              className="features-side-img" 
            />
          </div>
        </div>
      </div>

      {/* 3. VAULT TIERS & PRICING (Matching 3-Card Template) */}
      <div id="pricing" className="template-card pricing-section-card">
        <h3 className="pricing-title">Vault storage pricing</h3>
        <p className="pricing-sub">Check the tiers and choose the right privacy package for your files</p>

        <div className="pricing-cards-grid">
          {/* Tier 1 */}
          <div className="price-card">
            <div className="price-card-header">
              <span className="price-card-name">Starter Vault</span>
              <span className="price-card-desc">For personal files and documents</span>
            </div>
            <div className="price-amount">$0 <span>/ testnet</span></div>
            <ul className="price-features-list">
              <li><Check size={14} /> 5 GB Encrypted IPFS Storage</li>
              <li><Check size={14} /> Client-Side AES-256-GCM</li>
              <li><Check size={14} /> Base Sepolia EVM Records</li>
              <li><Check size={14} /> In-Browser Local Decryption</li>
            </ul>
            <button className="btn-cyan" style={{ width: '100%', justifyContent: 'center' }}>
              Get Started Free
            </button>
          </div>

          {/* Tier 2 (Featured Pro) */}
          <div className="price-card featured">
            <div className="price-card-header">
              <span className="price-card-name" style={{ color: '#0284c7' }}>Pro Vault (Recommended)</span>
              <span className="price-card-desc">For power creators and media archives</span>
            </div>
            <div className="price-amount">$19 <span>/ year</span></div>
            <ul className="price-features-list">
              <li><Check size={14} /> 100 GB High-Speed IPFS Pinning</li>
              <li><Check size={14} /> Zero-Knowledge Key Wrapping</li>
              <li><Check size={14} /> Multi-Wallet Access Control</li>
              <li><Check size={14} /> Unlimited On-Chain Verification</li>
            </ul>
            <button className="btn-cyan" style={{ width: '100%', justifyContent: 'center', background: '#0284c7' }}>
              Launch Pro Vault
            </button>
          </div>

          {/* Tier 3 */}
          <div className="price-card">
            <div className="price-card-header">
              <span className="price-card-name">Decentralized Lite</span>
              <span className="price-card-desc">For self-hosted IPFS nodes</span>
            </div>
            <div className="price-amount">$9 <span>/ year</span></div>
            <ul className="price-features-list">
              <li><Check size={14} /> 25 GB Custom IPFS Gateway</li>
              <li><Check size={14} /> Dedicated Smart Contract Registry</li>
              <li><Check size={14} /> Instant SHA-256 Integrity Checks</li>
              <li><Check size={14} /> Wallet-to-Wallet File Sharing</li>
            </ul>
            <button className="btn-cyan" style={{ width: '100%', justifyContent: 'center' }}>
              Choose Lite
            </button>
          </div>
        </div>
      </div>

      {/* 4. LIVE CRYPTO ENGINE SANDBOX */}
      <div id="crypto-demo" className="template-card sandbox-card">
        <div className="sandbox-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock size={20} color="#38bdf8" />
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Live Browser SubtleCrypto (AES-256-GCM)</span>
          </div>
          <span style={{ color: '#38bdf8', fontSize: '12px', fontFamily: 'monospace' }}>● Real-Time Execution</span>
        </div>

        <div className="sandbox-layout">
          <div className="sandbox-input-panel">
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>Plaintext Memory Input:</label>
            <textarea 
              value={demoInput} 
              onChange={(e) => setDemoInput(e.target.value)} 
              placeholder="Type sensitive data here to watch live encryption..."
            />
          </div>

          <div className="sandbox-output-panel">
            <div>
              <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>1. Random IV (Nonce):</div>
              <div style={{ color: '#38bdf8', wordBreak: 'break-all' }}>{demoOutput.iv}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>2. Encrypted Ciphertext:</div>
              <div style={{ color: '#38bdf8', wordBreak: 'break-all' }}>{demoOutput.ciphertext}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>3. Content-Addressed CID:</div>
              <div style={{ color: '#34d399', wordBreak: 'break-all' }}>{demoOutput.mockCid}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. CREATOR & COMMUNITY SECTION */}
      <div className="template-card creator-section-card">
        <img 
          src={mascotCharacter} 
          alt="DeStorage Mascot Character" 
          className="creator-mascot-img" 
        />

        <div className="creator-details">
          <h4 className="creator-title">Built by Sanket Padhyal</h4>
          <p className="creator-text">
            Full Stack & Web3 Engineer focused on decentralized systems, on-device AI models, and privacy-first software. DeStorage ensures that files, cryptographic keys, and ownership proofs belong exclusively to the user.
          </p>

          <div className="creator-btn-row">
            <a 
              href="https://sanketpadhyal.in" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-dark-pill"
            >
              <User size={15} />
              <span>sanketpadhyal.in</span>
              <ExternalLink size={13} />
            </a>

            <a 
              href="https://github.com/sanketpadhyal/DeStorage" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-cyan"
            >
              <GithubIcon size={15} />
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>
      </div>

      {/* 6. FOOTER */}
      <footer className="template-footer">
        <div>
          <strong>DeStorage</strong> • Privacy-First Decentralized Vault
        </div>
        <div>
          Created by <a href="https://sanketpadhyal.in" target="_blank" rel="noopener noreferrer">Sanket Padhyal</a> • MIT License
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
