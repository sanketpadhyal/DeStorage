import React, { useState, useEffect } from 'react';
import './LandingPage.css';
import { safeImages } from '../etc/safeimages';

import { 
  Lock, 
  Check, 
  ExternalLink,
  ArrowRight,
  User,
  Menu,
  X,
  FileText,
  Image,
  Video,
  Music,
  Box,
  ChevronRight
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

  // Always reset scroll to top on mount/refresh and clean URL hash
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Premium Scroll-Reveal IntersectionObserver
  useEffect(() => {
    const observerCallback: IntersectionObserverCallback = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('lp-visible');
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    const revealElements = document.querySelectorAll('.lp-reveal');
    revealElements.forEach(el => observer.observe(el));

    return () => {
      revealElements.forEach(el => observer.unobserve(el));
    };
  }, []);

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

  const scrollToSection = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  return (
    <div className="lp-root">
      
      {/* Background Dim Backdrop on Mobile Open */}
      <div 
        className={`lp-mobile-backdrop ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* 1. EXTENDING UNIFIED TOP NAVBAR & MOBILE PANEL */}
      <header className={`lp-navbar ${isMobileMenuOpen ? 'menu-open' : ''}`}>
        <div className="lp-container lp-nav-inner">
          <button 
            type="button"
            className="lp-brand-btn" 
            onClick={scrollToTop}
          >
            <img src={safeImages.logo} alt="DeStorage Logo" draggable={false} />
            <span>De<span className="lp-brand-accent">Storage</span></span>
          </button>

          {/* Desktop Navigation Links */}
          <ul className="lp-nav-links">
            <li>
              <button type="button" className="lp-nav-link-btn" onClick={() => scrollToSection('features')}>
                Why us
              </button>
            </li>
            <li>
              <button type="button" className="lp-nav-link-btn" onClick={() => scrollToSection('features')}>
                Architecture
              </button>
            </li>
            <li>
              <button type="button" className="lp-nav-link-btn" onClick={() => scrollToSection('filetypes')}>
                Supported Files
              </button>
            </li>
            <li>
              <button type="button" className="lp-nav-link-btn" onClick={() => scrollToSection('crypto-demo')}>
                Live Crypto Demo
              </button>
            </li>
            <li>
              <button type="button" className="lp-nav-link-btn" onClick={() => scrollToSection('pricing')}>
                Pricing
              </button>
            </li>
            <li>
              <button type="button" className="lp-nav-link-btn" onClick={() => scrollToSection('creator')}>
                Developer
              </button>
            </li>
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
            type="button"
            className={`lp-mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Seamless Animated Mobile Extension Panel */}
        <div className={`lp-mobile-panel ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="lp-container lp-mobile-panel-inner">
            <div className="lp-mobile-nav-group">
              <button type="button" className="lp-mobile-nav-link-btn" onClick={scrollToTop}>
                <span>Home</span>
                <ChevronRight size={16} className="lp-nav-chevron" />
              </button>
              <button type="button" className="lp-mobile-nav-link-btn" onClick={() => scrollToSection('features')}>
                <span>Why us & Architecture</span>
                <ChevronRight size={16} className="lp-nav-chevron" />
              </button>
              <button type="button" className="lp-mobile-nav-link-btn" onClick={() => scrollToSection('filetypes')}>
                <span>Supported Files</span>
                <ChevronRight size={16} className="lp-nav-chevron" />
              </button>
              <button type="button" className="lp-mobile-nav-link-btn" onClick={() => scrollToSection('pricing')}>
                <span>Storage Packages</span>
                <ChevronRight size={16} className="lp-nav-chevron" />
              </button>
              <button type="button" className="lp-mobile-nav-link-btn" onClick={() => scrollToSection('crypto-demo')}>
                <span>Live Crypto Demo</span>
                <ChevronRight size={16} className="lp-nav-chevron" />
              </button>
              <button type="button" className="lp-mobile-nav-link-btn" onClick={() => scrollToSection('creator')}>
                <span>Developer Profile</span>
                <ChevronRight size={16} className="lp-nav-chevron" />
              </button>
            </div>

            <div className="lp-mobile-panel-actions">
              <button 
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onLaunchApp) onLaunchApp();
                  else scrollToSection('crypto-demo');
                }}
                className="lp-btn-cyan"
              >
                <Box size={17} />
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
        </div>
      </header>

      {/* 2. MAIN SCROLLABLE CONTENT AREA */}
      <main className="lp-main-content">
        
        {/* RICH HERO SECTION */}
        <section id="hero" className="lp-hero-section">
          <div className="lp-container lp-hero-grid">
            <div className="lp-hero-left lp-reveal lp-reveal-up">
              <h1 className="lp-hero-title">
                Own your files with <span>proper decentralized</span> privacy.
              </h1>

              <p className="lp-hero-desc">
                We deliver browser-native AES-256-GCM encryption combined with IPFS content addressing and Base Sepolia EVM blockchain ownership records. Your plaintext keys never touch any centralized servers.
              </p>

              {/* Feature Checklist */}
              <div className="lp-hero-check-row">
                <div className="lp-hero-check-item">
                  <Check size={16} />
                  <span>Zero Plaintext Exposure</span>
                </div>
                <div className="lp-hero-check-item">
                  <Check size={16} />
                  <span>Non-Custodial Keys</span>
                </div>
                <div className="lp-hero-check-item">
                  <Check size={16} />
                  <span>Tamper-Proof SHA-256</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="lp-hero-actions">
                <button 
                  type="button"
                  onClick={onLaunchApp || (() => scrollToSection('crypto-demo'))}
                  className="lp-btn-cyan lp-btn-interactive"
                >
                  <Box size={17} />
                  <span>Launch Vault</span>
                  <ArrowRight size={16} />
                </button>

                <a 
                  href="https://github.com/sanketpadhyal/DeStorage" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="lp-btn-black lp-btn-interactive"
                >
                  <GithubIcon size={16} />
                  <span>View Source</span>
                </a>
              </div>

              {/* Hero Key Metrics Grid */}
              <div className="lp-hero-stats-grid lp-reveal lp-stagger-1">
                <div className="lp-hero-stat-box">
                  <span className="lp-hero-stat-val">256-Bit</span>
                  <span className="lp-hero-stat-label">AES-GCM Encryption</span>
                </div>
                <div className="lp-hero-stat-box">
                  <span className="lp-hero-stat-val">0 KB</span>
                  <span className="lp-hero-stat-label">Server Plaintext</span>
                </div>
                <div className="lp-hero-stat-box">
                  <span className="lp-hero-stat-val">100%</span>
                  <span className="lp-hero-stat-label">IPFS Content Addressed</span>
                </div>
                <div className="lp-hero-stat-box">
                  <span className="lp-hero-stat-val">Base EVM</span>
                  <span className="lp-hero-stat-label">Verified Ownership</span>
                </div>
              </div>
            </div>

            <div className="lp-hero-right lp-reveal lp-reveal-fade">
              <img 
                src={safeImages.heroIllustration} 
                alt="DeStorage Cloud Vault Hero Illustration" 
                className="lp-hero-img" 
                draggable={false}
              />
            </div>
          </div>
        </section>

        {/* SUPPORTED FILE TYPES SECTION */}
        <section id="filetypes" className="lp-filetypes-section">
          <div className="lp-container">
            <div className="lp-section-header lp-reveal lp-reveal-up">
              <h2 className="lp-section-title">Built for any confidential file format</h2>
            </div>

            <div className="lp-filetypes-grid">
              <div className="lp-filetype-card lp-card-animated lp-reveal lp-stagger-1">
                <div className="lp-filetype-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <Image size={22} />
                </div>
                <h4 className="lp-filetype-name">Pictures & Photos</h4>
                <p className="lp-filetype-desc">Encrypted gallery view with local in-memory decryption and zero-knowledge previews.</p>
              </div>

              <div className="lp-filetype-card lp-card-animated lp-reveal lp-stagger-2">
                <div className="lp-filetype-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                  <FileText size={22} />
                </div>
                <h4 className="lp-filetype-name">Documents & PDFs</h4>
                <p className="lp-filetype-desc">Zero-knowledge storage for legal, confidential contracts, financial papers, and identity docs.</p>
              </div>

              <div className="lp-filetype-card lp-card-animated lp-reveal lp-stagger-3">
                <div className="lp-filetype-icon" style={{ background: '#fdf2f8', color: '#db2777' }}>
                  <Video size={22} />
                </div>
                <h4 className="lp-filetype-name">Videos & Streaming</h4>
                <p className="lp-filetype-desc">Chunked cryptographic pipeline enabling ultra-fast encryption on large video archives.</p>
              </div>

              <div className="lp-filetype-card lp-card-animated lp-reveal lp-stagger-4">
                <div className="lp-filetype-icon" style={{ background: '#faf5ff', color: '#7c3aed' }}>
                  <Music size={22} />
                </div>
                <h4 className="lp-filetype-name">Audio & Music</h4>
                <p className="lp-filetype-desc">Protected sound archives, audio recordings, and wallet-to-wallet decentralized sharing.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ARCHITECTURE & SECURITY */}
        <section id="features" className="lp-features-section">
          <div className="lp-container">
            <div className="lp-section-header lp-reveal lp-reveal-up">
              <h2 className="lp-section-title">Our deep decentralized security</h2>
            </div>
            
            <div className="lp-features-grid">
              <div className="lp-numbered-2x2">
                <div className="lp-numbered-item lp-card-animated lp-reveal lp-stagger-1">
                  <span className="lp-item-num">1</span>
                  <h3 className="lp-item-title">Client-Side Web Crypto</h3>
                  <p className="lp-item-desc">
                    Files are encrypted locally in your browser with AES-256-GCM before upload. Plaintext never touches any server.
                  </p>
                </div>

                <div className="lp-numbered-item lp-card-animated lp-reveal lp-stagger-2">
                  <span className="lp-item-num">2</span>
                  <h3 className="lp-item-title">IPFS Content Addressing</h3>
                  <p className="lp-item-desc">
                    Encrypted ciphertexts are pinned across decentralized IPFS nodes, generating verifiable content-addressed CIDs.
                  </p>
                </div>

                <div className="lp-numbered-item lp-card-animated lp-reveal lp-stagger-3">
                  <span className="lp-item-num">3</span>
                  <h3 className="lp-item-title">Base Sepolia Ownership</h3>
                  <p className="lp-item-desc">
                    File registration, immutable ownership records, and SHA-256 integrity proofs are verified permanently on-chain.
                  </p>
                </div>

                <div className="lp-numbered-item lp-card-animated lp-reveal lp-stagger-4">
                  <span className="lp-item-num">4</span>
                  <h3 className="lp-item-title">Zero-Knowledge Sharing</h3>
                  <p className="lp-item-desc">
                    Share files directly with wallet addresses using public-key wrapped encryption without ever exposing master keys.
                  </p>
                </div>
              </div>

              <div className="lp-reveal lp-reveal-fade">
                <img 
                  src={safeImages.featuresIllustration} 
                  alt="Cryptographic Integrity & Inspection Illustration" 
                  className="lp-features-img" 
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </section>

        {/* VAULT TIERS & PRICING */}
        <section id="pricing" className="lp-pricing-section">
          <div className="lp-container" style={{ textAlign: 'center' }}>
            <div className="lp-reveal lp-reveal-up">
              <h2 className="lp-section-title">Vault storage pricing</h2>
              <p style={{ color: '#64748b', fontSize: '15px', marginTop: '6px' }}>
                Check the tiers and choose the right privacy package for your files
              </p>
            </div>

            <div className="lp-pricing-grid">
              {/* Tier 1 */}
              <div className="lp-price-card lp-card-animated lp-reveal lp-stagger-1">
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
                <button type="button" className="lp-btn-cyan lp-btn-interactive" style={{ width: '100%', justifyContent: 'center' }}>
                  Get Started Free
                </button>
              </div>

              {/* Tier 2 (Featured) */}
              <div className="lp-price-card featured lp-card-animated lp-reveal lp-stagger-2">
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
                <button type="button" className="lp-btn-cyan lp-btn-interactive" style={{ width: '100%', justifyContent: 'center' }}>
                  Launch Pro Vault
                </button>
              </div>

              {/* Tier 3 */}
              <div className="lp-price-card lp-card-animated lp-stagger-3 lp-reveal">
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
                <button type="button" className="lp-btn-cyan lp-btn-interactive" style={{ width: '100%', justifyContent: 'center' }}>
                  Choose Lite
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* LIVE CRYPTO ENGINE SANDBOX */}
        <section id="crypto-demo" className="lp-sandbox-section">
          <div className="lp-container">
            <div className="lp-sandbox-header lp-reveal lp-reveal-up">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lock size={20} color="#38bdf8" />
                <span style={{ fontWeight: 700, fontSize: '16px' }}>Live Browser SubtleCrypto (AES-256-GCM) Sandbox</span>
              </div>
              <span style={{ color: '#38bdf8', fontSize: '12.5px', fontFamily: 'monospace' }}>● Real-Time Execution</span>
            </div>

            <div className="lp-sandbox-layout">
              <div className="lp-sandbox-input-box lp-reveal lp-stagger-1">
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Plaintext Memory Input (Type anything to test):</label>
                <textarea 
                  value={demoInput} 
                  onChange={(e) => setDemoInput(e.target.value)} 
                  placeholder="Type sensitive data here to watch real-time encryption..."
                />
              </div>

              <div className="lp-sandbox-output-box lp-reveal lp-stagger-2">
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

        {/* CREATOR & COMMUNITY */}
        <section id="creator" className="lp-creator-section">
          <div className="lp-container">
            <div className="lp-creator-card lp-card-animated lp-reveal lp-reveal-up">
              <img 
                src={safeImages.mascotCharacter} 
                alt="DeStorage Mascot Character" 
                className="lp-mascot-img" 
                draggable={false}
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

        {/* FOOTER */}
        <footer className="lp-footer">
          <div className="lp-container lp-footer-inner">
            <div>
              <strong>De<span className="lp-brand-accent">Storage</span></strong> • Privacy-First Decentralized Vault
            </div>
            <div>
              Created by <a href="https://sanketpadhyal.in" target="_blank" rel="noopener noreferrer">Sanket Padhyal</a> • MIT License
            </div>
          </div>
        </footer>

      </main>

    </div>
  );
};

export default LandingPage;
