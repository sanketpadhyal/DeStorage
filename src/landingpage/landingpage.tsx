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
  User,
  Menu,
  X
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
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

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="lp-root animate-blur-in">
      
      {/* 1. FULL-WIDTH STICKY NAVBAR */}
      <header className="lp-navbar">
        <div className="lp-container lp-nav-inner">
          <a href="#hero" className="lp-brand" onClick={closeMobileMenu}>
            <img src={logoImg} alt="DeStorage Logo" />
            <span>DeStorage</span>
            <span className="lp-subdomain-chip">destorage.sanketpadhyal.in</span>
          </a>

          {/* Desktop Navigation Links */}
          <ul className="lp-nav-links">
            <li><a href="#features" className="lp-nav-link">Why us</a></li>
            <li><a href="#features" className="lp-nav-link">Architecture</a></li>
            <li><a href="#crypto-demo" className="lp-nav-link">Live Crypto Demo</a></li>
            <li><a href="#pricing" className="lp-nav-link">Pricing</a></li>
            <li><a href="#creator" className="lp-nav-link">Developer</a></li>
          </ul>

          {/* Desktop Actions */}
          <div className="lp-nav-actions">
            <a 
              href="https://github.com/sanketpadhyal/DeStorage" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="lp-btn-black"
            >
              <GithubIcon size={16} />
              <span>GitHub</span>
            </a>
          </div>

          {/* Mobile Menu Hamburger Toggle */}
          <button 
            className="lp-mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Mobile Dropdown Panel */}
        <div className={`lp-mobile-panel ${isMobileMenuOpen ? 'open' : ''}`}>
          <a href="#hero" className="lp-mobile-nav-link" onClick={closeMobileMenu}>Home</a>
          <a href="#features" className="lp-mobile-nav-link" onClick={closeMobileMenu}>Why us & Architecture</a>
          <a href="#pricing" className="lp-mobile-nav-link" onClick={closeMobileMenu}>Storage Packages</a>
          <a href="#crypto-demo" className="lp-mobile-nav-link" onClick={closeMobileMenu}>Live Crypto Demo</a>
          <a href="#creator" className="lp-mobile-nav-link" onClick={closeMobileMenu}>Developer Profile</a>

          <div className="lp-mobile-panel-actions">
            <button 
              onClick={() => {
                closeMobileMenu();
                if (onLaunchApp) onLaunchApp();
                else {
                  const el = document.getElementById('crypto-demo');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="lp-btn-cyan"
            >
              <span>Launch Vault</span>
              <ArrowRight size={16} />
            </button>

            <a 
              href="https://github.com/sanketpadhyal/DeStorage" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="lp-btn-black"
            >
              <GithubIcon size={16} />
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. FULL-SCREEN HERO SECTION */}
      <section id="hero" className="lp-hero-section">
        <div className="lp-container lp-hero-grid">
          <div className="lp-hero-left">
            <div className="lp-hero-badge">
              <div className="lp-hero-badge-dot"></div>
              <span>Client-Side AES-256-GCM • IPFS • Base Sepolia</span>
            </div>

            <h1 className="lp-hero-title">
              Own your files with <span>proper decentralized</span> privacy.
            </h1>

            <p className="lp-hero-desc">
              We deliver browser-native AES-256-GCM encryption combined with IPFS content addressing and Base Sepolia EVM blockchain ownership records.
            </p>

            <div className="lp-hero-actions">
              <button 
                onClick={onLaunchApp || (() => {
                  const el = document.getElementById('crypto-demo');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                })}
                className="lp-btn-cyan"
              >
                <span>Launch Vault</span>
                <ArrowRight size={16} />
              </button>

              <a 
                href="https://github.com/sanketpadhyal/DeStorage" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="lp-btn-black"
              >
                <GithubIcon size={16} />
                <span>View Source</span>
              </a>
            </div>
          </div>

          <div className="lp-hero-right">
            <img 
              src={heroIllustration} 
              alt="DeStorage Cloud Vault Hero Illustration" 
              className="lp-hero-img" 
            />
          </div>
        </div>
      </section>

      {/* 3. ARCHITECTURE & SECURITY (2x2 with side illustration) */}
      <section id="features" className="lp-features-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-tag">Security Architecture</span>
            <h2 className="lp-section-title">Our deep decentralized security</h2>
          </div>
          
          <div className="lp-features-grid">
            <div className="lp-numbered-2x2">
              <div className="lp-numbered-item">
                <span className="lp-item-num">1</span>
                <h3 className="lp-item-title">Client-Side Web Crypto</h3>
                <p className="lp-item-desc">
                  Files are encrypted locally in your browser with AES-256-GCM before upload. Plaintext never touches any server.
                </p>
              </div>

              <div className="lp-numbered-item">
                <span className="lp-item-num">2</span>
                <h3 className="lp-item-title">IPFS Content Addressing</h3>
                <p className="lp-item-desc">
                  Encrypted ciphertexts are pinned across decentralized IPFS nodes, generating verifiable content-addressed CIDs.
                </p>
              </div>

              <div className="lp-numbered-item">
                <span className="lp-item-num">3</span>
                <h3 className="lp-item-title">Base Sepolia Ownership</h3>
                <p className="lp-item-desc">
                  File registration, immutable ownership records, and SHA-256 integrity proofs are verified permanently on-chain.
                </p>
              </div>

              <div className="lp-numbered-item">
                <span className="lp-item-num">4</span>
                <h3 className="lp-item-title">Zero-Knowledge Sharing</h3>
                <p className="lp-item-desc">
                  Share files directly with wallet addresses using public-key wrapped encryption without ever exposing master keys.
                </p>
              </div>
            </div>

            <div>
              <img 
                src={featuresIllustration} 
                alt="Cryptographic Integrity & Inspection Illustration" 
                className="lp-features-img" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. VAULT TIERS & PRICING */}
      <section id="pricing" className="lp-pricing-section">
        <div className="lp-container" style={{ textAlign: 'center' }}>
          <span className="lp-section-tag">Storage Packages</span>
          <h2 className="lp-section-title">Vault storage pricing</h2>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '6px' }}>
            Check the tiers and choose the right privacy package for your files
          </p>

          <div className="lp-pricing-grid">
            {/* Tier 1 */}
            <div className="lp-price-card">
              <div>
                <h4 className="lp-price-name">Starter Vault</h4>
                <p className="lp-price-desc">For personal files and documents</p>
                <div className="lp-price-val">$0 <span>/ testnet</span></div>
              </div>
              <ul className="lp-price-list">
                <li><Check size={16} /> 5 GB Encrypted IPFS Storage</li>
                <li><Check size={16} /> Client-Side AES-256-GCM</li>
                <li><Check size={16} /> Base Sepolia EVM Records</li>
                <li><Check size={16} /> In-Browser Local Decryption</li>
              </ul>
              <button className="lp-btn-cyan" style={{ width: '100%', justifyContent: 'center' }}>
                Get Started Free
              </button>
            </div>

            {/* Tier 2 (Featured) */}
            <div className="lp-price-card featured">
              <div>
                <h4 className="lp-price-name" style={{ color: '#0284c7' }}>Pro Vault (Recommended)</h4>
                <p className="lp-price-desc">For power creators and media archives</p>
                <div className="lp-price-val">$19 <span>/ year</span></div>
              </div>
              <ul className="lp-price-list">
                <li><Check size={16} /> 100 GB High-Speed IPFS Pinning</li>
                <li><Check size={16} /> Zero-Knowledge Key Wrapping</li>
                <li><Check size={16} /> Multi-Wallet Access Control</li>
                <li><Check size={16} /> Unlimited On-Chain Verification</li>
              </ul>
              <button className="lp-btn-cyan" style={{ width: '100%', justifyContent: 'center', background: '#0284c7' }}>
                Launch Pro Vault
              </button>
            </div>

            {/* Tier 3 */}
            <div className="lp-price-card">
              <div>
                <h4 className="lp-price-name">Decentralized Lite</h4>
                <p className="lp-price-desc">For self-hosted IPFS nodes</p>
                <div className="lp-price-val">$9 <span>/ year</span></div>
              </div>
              <ul className="lp-price-list">
                <li><Check size={16} /> 25 GB Custom IPFS Gateway</li>
                <li><Check size={16} /> Dedicated Smart Contract Registry</li>
                <li><Check size={16} /> Instant SHA-256 Integrity Checks</li>
                <li><Check size={16} /> Wallet-to-Wallet File Sharing</li>
              </ul>
              <button className="lp-btn-cyan" style={{ width: '100%', justifyContent: 'center' }}>
                Choose Lite
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LIVE CRYPTO ENGINE SANDBOX */}
      <section id="crypto-demo" className="lp-sandbox-section">
        <div className="lp-container">
          <div className="lp-sandbox-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock size={20} color="#38bdf8" />
              <span style={{ fontWeight: 700, fontSize: '16px' }}>Live Browser SubtleCrypto (AES-256-GCM) Sandbox</span>
            </div>
            <span style={{ color: '#38bdf8', fontSize: '12.5px', fontFamily: 'monospace' }}>● Real-Time Execution</span>
          </div>

          <div className="lp-sandbox-layout">
            <div className="lp-sandbox-input-box">
              <label style={{ fontSize: '12px', color: '#94a3b8' }}>Plaintext Memory Input (Type anything to test):</label>
              <textarea 
                value={demoInput} 
                onChange={(e) => setDemoInput(e.target.value)} 
                placeholder="Type sensitive data here to watch real-time encryption..."
              />
            </div>

            <div className="lp-sandbox-output-box">
              <div>
                <div className="lp-sandbox-field-label">1. Random 12-Byte IV (Nonce):</div>
                <div className="lp-sandbox-field-val">{demoOutput.iv}</div>
              </div>
              <div>
                <div className="lp-sandbox-field-label">2. Encrypted Ciphertext:</div>
                <div className="lp-sandbox-field-val">{demoOutput.ciphertext}</div>
              </div>
              <div>
                <div className="lp-sandbox-field-label">3. Content-Addressed CID:</div>
                <div style={{ color: '#34d399', wordBreak: 'break-all' }}>{demoOutput.mockCid}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CREATOR & COMMUNITY SECTION */}
      <section id="creator" className="lp-creator-section">
        <div className="lp-container">
          <div className="lp-creator-card">
            <img 
              src={mascotCharacter} 
              alt="DeStorage Mascot Character" 
              className="lp-mascot-img" 
            />

            <div className="lp-creator-details">
              <h3 className="lp-creator-name">Built by Sanket Padhyal</h3>
              <p className="lp-creator-bio">
                Full Stack & Web3 Engineer building decentralized systems, on-device AI models, and privacy-first software. DeStorage ensures that files, cryptographic keys, and ownership proofs belong exclusively to the user.
              </p>

              <div className="lp-creator-actions">
                <a 
                  href="https://sanketpadhyal.in" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="lp-btn-black"
                >
                  <User size={15} />
                  <span>sanketpadhyal.in</span>
                  <ExternalLink size={13} />
                </a>

                <a 
                  href="https://github.com/sanketpadhyal/DeStorage" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="lp-btn-cyan"
                >
                  <GithubIcon size={15} />
                  <span>GitHub Repository</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FULL-WIDTH FOOTER */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div>
            <strong>DeStorage</strong> • Privacy-First Decentralized Vault
          </div>
          <div>
            Created by <a href="https://sanketpadhyal.in" target="_blank" rel="noopener noreferrer">Sanket Padhyal</a> • MIT License
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
