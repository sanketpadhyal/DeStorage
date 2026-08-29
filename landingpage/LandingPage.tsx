import React, { useState, useEffect } from 'react';
import './LandingPage.css';
import { safeImages } from '../etc/safeimages';
import { Icon } from '@iconify/react';

import { 
  Lock, 
  Check, 
  ExternalLink, 
  ArrowRight, 
  Globe, 
  Menu, 
  X, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Box, 
  ChevronRight, 
  Zap,
  ShieldCheck,
  Key,
  Database,
  Layers,
  Cpu,
  LockKeyhole,
  Folder
} from 'lucide-react';

const GithubIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

import { bufToHex } from '../crypto/encryptionEngine';

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

  // Hero Image Local Storage Caching & Skeleton Loader
  const [heroImageSrc, setHeroImageSrc] = useState<string>(() => {
    try {
      return localStorage.getItem('destorage_hero_illustration_v1') || '';
    } catch {
      return '';
    }
  });
  const [isHeroLoaded, setIsHeroLoaded] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('destorage_hero_illustration_v1'));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (heroImageSrc) {
      setIsHeroLoaded(true);
      return;
    }

    const img = new window.Image();
    img.src = safeImages.heroIllustration;
    img.onload = () => {
      fetch(safeImages.heroIllustration)
        .then(res => res.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            try {
              localStorage.setItem('destorage_hero_illustration_v1', base64);
            } catch (e) {
              console.warn('Could not store hero illustration in localStorage:', e);
            }
            setHeroImageSrc(base64);
            setIsHeroLoaded(true);
          };
          reader.readAsDataURL(blob);
        })
        .catch(() => {
          setHeroImageSrc(safeImages.heroIllustration);
          setIsHeroLoaded(true);
        });
    };
  }, [heroImageSrc]);

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

  // Scroll-Reveal IntersectionObserver
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

  // Real-time client-side Web Crypto AES-256-GCM encryption in O(n)
  useEffect(() => {
    let isCancelled = false;

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
          { name: 'AES-GCM', iv },
          key,
          encodedText
        );

        if (isCancelled) return;

        const hashBuf = await window.crypto.subtle.digest('SHA-256', encryptedBuf);
        const hashHex = bufToHex(hashBuf);
        const ivHex = bufToHex(iv);
        const cipherHex = bufToHex(encryptedBuf).slice(0, 24) + '...';

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

    return () => {
      isCancelled = true;
    };
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
          </ul>

          {/* Desktop Actions */}
          <div className="lp-nav-actions">
            <a 
              href="https://github.com/sanketpadhyal" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="lp-btn-black"
            >
              <GithubIcon size={16} />
              <span>Developer</span>
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
              <button type="button" className="lp-mobile-nav-link-btn" onClick={() => scrollToSection('crypto-demo')}>
                <span>Live Crypto Demo</span>
                <ChevronRight size={16} className="lp-nav-chevron" />
              </button>
            </div>

            {/* Open Source Watermark & Attribution Card */}
            <div className="lp-mobile-watermark">
              <img 
                src="https://github.com/sanketpadhyal.png" 
                alt="Sanket Padhyal" 
                className="lp-mobile-watermark-avatar"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = safeImages.mascotCharacter;
                }}
              />
              <div className="lp-mobile-watermark-content">
                <p className="lp-mobile-watermark-author">
                  Engineered by <strong>Sanket Padhyal</strong>
                </p>
                <p className="lp-mobile-watermark-license">
                  Open Source Architecture under <strong>MIT License</strong>
                </p>
              </div>
              <a 
                href="https://github.com/sanketpadhyal/DeStorage"
                target="_blank"
                rel="noopener noreferrer"
                className="lp-mobile-watermark-link"
              >
                <GithubIcon size={13} />
                <span>Contribute on GitHub</span>
                <ChevronRight size={13} />
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
                Own your files with <span>true zero-knowledge</span> privacy.
              </h1>

              <p className="lp-hero-desc">
                Bank-grade client-side AES-256-GCM encryption with Web3 wallet-derived Master Key wrapping (PBKDF2 120k iterations), decentralized IPFS storage, and Base Sepolia EVM ownership verification. Zero server keys. 100% sovereign.
              </p>

              {/* Feature Checklist */}
              <div className="lp-hero-check-row">
                <div className="lp-hero-check-item">
                  <Check size={16} />
                  <span>Envelope Encryption (Key Wrapping)</span>
                </div>
                <div className="lp-hero-check-item">
                  <Check size={16} />
                  <span>Non-Custodial Keys (120k PBKDF2)</span>
                </div>
                <div className="lp-hero-check-item">
                  <Check size={16} />
                  <span>Recursive Folder & File Uploads</span>
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

                <button
                  type="button"
                  onClick={() => scrollToSection('crypto-demo')}
                  className="lp-btn-glass lp-btn-interactive"
                >
                  <span className="lp-btn-icon-wrap">
                    <Zap size={14} />
                  </span>
                  <span>Live Sandbox</span>
                </button>
              </div>

              {/* Hero Key Metrics Cards (Multi-Color Icon Suite) */}
              <div className="lp-hero-stats-grid lp-reveal lp-stagger-1">
                {/* Stat 1: AES-256 */}
                <div className="lp-hero-stat-card lp-stat-blue">
                  <div className="lp-hero-stat-icon lp-icon-blue">
                    <Icon icon="iconamoon:shield-yes-bold" width={20} height={20} />
                  </div>
                  <div className="lp-hero-stat-body">
                    <span className="lp-hero-stat-val">256-Bit</span>
                    <span className="lp-hero-stat-label">AES-GCM Security</span>
                  </div>
                </div>

                {/* Stat 2: Zero Plaintext */}
                <div className="lp-hero-stat-card lp-stat-emerald">
                  <div className="lp-hero-stat-icon lp-icon-emerald">
                    <Icon icon="iconamoon:lock-bold" width={20} height={20} />
                  </div>
                  <div className="lp-hero-stat-body">
                    <span className="lp-hero-stat-val">0 KB</span>
                    <span className="lp-hero-stat-label">Server Plaintext</span>
                  </div>
                </div>

                {/* Stat 3: 100% IPFS */}
                <div className="lp-hero-stat-card lp-stat-purple">
                  <div className="lp-hero-stat-icon lp-icon-purple">
                    <Icon icon="iconamoon:cloud-bold" width={20} height={20} />
                  </div>
                  <div className="lp-hero-stat-body">
                    <span className="lp-hero-stat-val">100%</span>
                    <span className="lp-hero-stat-label">IPFS Addressed</span>
                  </div>
                </div>

                {/* Stat 4: Base EVM */}
                <div className="lp-hero-stat-card lp-stat-amber">
                  <div className="lp-hero-stat-icon lp-icon-amber">
                    <Icon icon="iconamoon:apps-bold" width={20} height={20} />
                  </div>
                  <div className="lp-hero-stat-body">
                    <span className="lp-hero-stat-val">Base EVM</span>
                    <span className="lp-hero-stat-label">Verified Proofs</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lp-hero-right lp-reveal lp-reveal-fade">
              <div className="lp-hero-img-wrapper">
                {!isHeroLoaded && (
                  <div className="lp-hero-skeleton">
                    <div className="lp-hero-skeleton-wave" />
                  </div>
                )}
                <img 
                  src={heroImageSrc || safeImages.heroIllustration} 
                  alt="DeStorage Cloud Vault Hero Illustration" 
                  className={`lp-hero-img ${isHeroLoaded ? 'lp-hero-img-loaded' : 'lp-hero-img-loading'}`} 
                  draggable={false}
                  onLoad={() => setIsHeroLoaded(true)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SUPPORTED FILE TYPES SECTION */}
        <section id="filetypes" className="lp-filetypes-section">
          <div className="lp-container">
            <div className="lp-section-header lp-reveal lp-reveal-up">
              <h2 className="lp-section-title">Built for any confidential <span>file or folder format</span></h2>
            </div>

            <div className="lp-filetypes-grid">
              <div className="lp-filetype-card lp-card-animated lp-reveal lp-stagger-1">
                <div className="lp-filetype-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                  <Folder size={22} />
                </div>
                <h4 className="lp-filetype-name">Directories & Folders</h4>
                <p className="lp-filetype-desc">Full directory uploads, recursive client-side encryption, dedicated folder cards, and drill-down breadcrumb navigation.</p>
              </div>

              <div className="lp-filetype-card lp-card-animated lp-reveal lp-stagger-2">
                <div className="lp-filetype-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <Image size={22} />
                </div>
                <h4 className="lp-filetype-name">Pictures & Photos</h4>
                <p className="lp-filetype-desc">Encrypted gallery view with local in-memory decryption and zero-knowledge previews.</p>
              </div>

              <div className="lp-filetype-card lp-card-animated lp-reveal lp-stagger-3">
                <div className="lp-filetype-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                  <FileText size={22} />
                </div>
                <h4 className="lp-filetype-name">Documents & PDFs</h4>
                <p className="lp-filetype-desc">Zero-knowledge storage for legal contracts, confidential papers, financial sheets, and identity documents.</p>
              </div>

              <div className="lp-filetype-card lp-card-animated lp-reveal lp-stagger-4">
                <div className="lp-filetype-icon" style={{ background: '#fdf2f8', color: '#db2777' }}>
                  <Video size={22} />
                </div>
                <h4 className="lp-filetype-name">Videos & Streaming</h4>
                <p className="lp-filetype-desc">Chunked cryptographic pipeline enabling zero-knowledge client decryption on video recordings.</p>
              </div>

              <div className="lp-filetype-card lp-card-animated lp-reveal lp-stagger-5">
                <div className="lp-filetype-icon" style={{ background: '#faf5ff', color: '#7c3aed' }}>
                  <Music size={22} />
                </div>
                <h4 className="lp-filetype-name">Audio & Music</h4>
                <p className="lp-filetype-desc">Protected sound archives, audio recordings, and wallet-to-wallet decentralized sharing.</p>
              </div>

              <div className="lp-filetype-card lp-card-animated lp-reveal lp-stagger-6">
                <div className="lp-filetype-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
                  <Box size={22} />
                </div>
                <h4 className="lp-filetype-name">Codebases & Archives</h4>
                <p className="lp-filetype-desc">Sovereign backups for zip packages, datasets, repositories, and raw binaries with SHA-256 integrity.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. INTERACTIVE CRYPTOGRAPHIC GRAPH TREE & DATAFLOW ARCHITECTURE */}
        <section id="architecture" className="lp-arch-tree-section">
          <div className="lp-container">
            <div className="lp-section-header lp-reveal lp-reveal-up">
              <h2 className="lp-section-title">How your files & media are <span>mathematically protected</span></h2>
              <p className="lp-section-subtitle">
                Zero server knowledge. Every byte is encrypted in volatile client memory before hitting IPFS or the Base blockchain. Here is the verified end-to-end cryptographic lifecycle.
              </p>
            </div>

            {/* Visual Multi-Node Cryptographic Graph Tree */}
            <div className="lp-tree-wrapper lp-reveal lp-stagger-1">

              {/* Node 1: Deterministic Master Key Derivation */}
              <div className="lp-tree-node lp-node-blue lp-card-animated">
                <div className="lp-tree-node-badge">STAGE 01</div>
                <div className="lp-tree-node-icon lp-icon-blue">
                  <Key size={24} />
                </div>
                <div className="lp-tree-node-content">
                  <div className="lp-tree-node-header">
                    <h4 className="lp-tree-node-title">1. Deterministic Master Key Derivation</h4>
                    <span className="lp-tree-node-tech">PBKDF2-SHA256 • 120,000 Rounds</span>
                  </div>
                  <p className="lp-tree-node-desc">
                    Your MetaMask wallet signs a deterministic EIP-191 cryptographic challenge. Fed through PBKDF2 with 120,000 iterations and your wallet address as salt, deriving a 256-bit AES-GCM Master Key strictly inside browser volatile memory (<code className="lp-inline-code">SubtleCrypto</code>). Zero private keys or passwords ever leave your machine.
                  </p>
                  <div className="lp-tree-node-specs">
                    <span className="lp-spec-item">Algorithm: PBKDF2-HMAC-SHA256</span>
                    <span className="lp-spec-item">Iterations: 120,000</span>
                    <span className="lp-spec-item">Salt: DeStorage_Master_Key_Salt_0x...</span>
                  </div>
                </div>
              </div>

              {/* Tree Connector 1 */}
              <div className="lp-tree-connector">
                <div className="lp-tree-line"></div>
                <div className="lp-tree-arrow">
                  <Icon icon="iconamoon:arrow-down-2-bold" width={22} height={22} />
                </div>
                <span className="lp-tree-step-label">File Selected locally (Photos, Docs, Videos)</span>
              </div>

              {/* Node 2: On-Device File Encryption */}
              <div className="lp-tree-node lp-node-emerald lp-card-animated">
                <div className="lp-tree-node-badge">STAGE 02</div>
                <div className="lp-tree-node-icon lp-icon-emerald">
                  <LockKeyhole size={24} />
                </div>
                <div className="lp-tree-node-content">
                  <div className="lp-tree-node-header">
                    <h4 className="lp-tree-node-title">2. Client-Side AES-256-GCM File Encryption</h4>
                    <span className="lp-tree-node-tech">AES-256-GCM + 96-Bit Random IV</span>
                  </div>
                  <p className="lp-tree-node-desc">
                    For every uploaded item, the browser generates an ephemeral 256-bit AES encryption key and a unique 12-byte initialization vector (IV) via <code className="lp-inline-code">crypto.getRandomValues</code>. The file buffer is encrypted in-place into authenticated ciphertext with 128-bit AEAD tag protection.
                  </p>
                  <div className="lp-tree-node-specs">
                    <span className="lp-spec-item">Cipher: AES-256-GCM (AEAD)</span>
                    <span className="lp-spec-item">Auth Tag: 128-Bit Integrity Tag</span>
                    <span className="lp-spec-item">Nonce: 96-Bit Unique IV</span>
                  </div>
                </div>
              </div>

              {/* Tree Connector 2 */}
              <div className="lp-tree-connector">
                <div className="lp-tree-line"></div>
                <div className="lp-tree-arrow">
                  <Icon icon="iconamoon:arrow-down-2-bold" width={22} height={22} />
                </div>
                <span className="lp-tree-step-label">Master Key Envelope Wrapping & Checksum</span>
              </div>

              {/* Node 3: Envelope Wrapping & SHA-256 Checksum */}
              <div className="lp-tree-node lp-node-purple lp-card-animated">
                <div className="lp-tree-node-badge">STAGE 03</div>
                <div className="lp-tree-node-icon lp-icon-purple">
                  <Layers size={24} />
                </div>
                <div className="lp-tree-node-content">
                  <div className="lp-tree-node-header">
                    <h4 className="lp-tree-node-title">3. Envelope Key Wrapping & SHA-256 Checksum</h4>
                    <span className="lp-tree-node-tech">AES-GCM Key Wrap + SHA-256</span>
                  </div>
                  <p className="lp-tree-node-desc">
                    The file's random 256-bit key is wrapped (double-encrypted) using the user's Master Key and a dedicated wrap IV (<code className="lp-inline-code">kiv</code>). Simultaneously, a deterministic SHA-256 hash of the ciphertext is computed to guarantee mathematically auditable, tamper-proof file integrity.
                  </p>
                  <div className="lp-tree-node-specs">
                    <span className="lp-spec-item">Key Wrapping: AES-GCM Envelope</span>
                    <span className="lp-spec-item">Integrity: SHA-256 Cryptographic Hash</span>
                    <span className="lp-spec-item">Server Plaintext: 0 Bytes</span>
                  </div>
                </div>
              </div>

              {/* Tree Connector 3 */}
              <div className="lp-tree-connector">
                <div className="lp-tree-line"></div>
                <div className="lp-tree-arrow">
                  <Icon icon="iconamoon:arrow-down-2-bold" width={22} height={22} />
                </div>
                <span className="lp-tree-step-label">Decentralized IPFS Pinning (CID v1)</span>
              </div>

              {/* Node 4: IPFS Decentralized Storage */}
              <div className="lp-tree-node lp-node-cyan lp-card-animated">
                <div className="lp-tree-node-badge">STAGE 04</div>
                <div className="lp-tree-node-icon lp-icon-blue">
                  <Database size={24} />
                </div>
                <div className="lp-tree-node-content">
                  <div className="lp-tree-node-header">
                    <h4 className="lp-tree-node-title">4. Immutable IPFS Content Addressing</h4>
                    <span className="lp-tree-node-tech">CID v1 (bafkrei...) • Global Peer Nodes</span>
                  </div>
                  <p className="lp-tree-node-desc">
                    The encrypted ciphertext is uploaded to IPFS. It receives a unique, content-addressed CID (<code className="lp-inline-code">bafkrei...</code>). Pinata distributes the ciphertext across decentralized gateway nodes globally. Even if IPFS traffic is intercepted, adversaries only see random, uncrackable ciphertext bytes.
                  </p>
                  <div className="lp-tree-node-specs">
                    <span className="lp-spec-item">Protocol: IPFS CID v1 (Base32)</span>
                    <span className="lp-spec-item">Nodes: Global Distributed Swarm</span>
                    <span className="lp-spec-item">Data Privacy: 100% Zero-Knowledge</span>
                  </div>
                </div>
              </div>

              {/* Tree Connector 4 */}
              <div className="lp-tree-connector">
                <div className="lp-tree-line"></div>
                <div className="lp-tree-arrow">
                  <Icon icon="iconamoon:arrow-down-2-bold" width={22} height={22} />
                </div>
                <span className="lp-tree-step-label">Base Sepolia L2 Blockchain Anchoring & Decryption</span>
              </div>

              {/* Node 5: Blockchain Smart Contract Proofs & Zero-Knowledge Decryption */}
              <div className="lp-tree-node lp-node-amber lp-card-animated">
                <div className="lp-tree-node-badge">STAGE 05</div>
                <div className="lp-tree-node-icon lp-icon-amber">
                  <Cpu size={24} />
                </div>
                <div className="lp-tree-node-content">
                  <div className="lp-tree-node-header">
                    <h4 className="lp-tree-node-title">5. Base EVM Ownership & 1-Signature RAM Decryption</h4>
                    <span className="lp-tree-node-tech">Base Sepolia Smart Contract + In-Memory Blob</span>
                  </div>
                  <p className="lp-tree-node-desc">
                    Ownership proofs and CIDs are anchored on Base Sepolia. On any new device, you sign once with MetaMask to unlock the Master Key in volatile memory. Files are fetched from IPFS, verified against SHA-256, unwrapped, and streamed into RAM-only blob URLs. Zero disk traces remain on logout.
                  </p>
                  <div className="lp-tree-node-specs">
                    <span className="lp-spec-item">Network: Base Sepolia Ethereum L2</span>
                    <span className="lp-spec-item">Decryption: In-Memory Blob URL</span>
                    <span className="lp-spec-item">Session Cache: RAM Only (Purged on Close)</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Security vs Centralized Cloud Matrix */}
            <div className="lp-security-matrix lp-card-animated lp-reveal lp-stagger-2">
              <div className="lp-matrix-header">
                <div className="lp-matrix-header-icon">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h3 className="lp-matrix-title">Security Comparison: DeStorage vs Centralized Cloud</h3>
                  <p className="lp-matrix-subtitle">Auditable, cryptographic guarantees compared to Google Photos, Dropbox, and iCloud</p>
                </div>
              </div>

              <div className="lp-matrix-table-wrap">
                <table className="lp-matrix-table">
                  <thead>
                    <tr>
                      <th>Security Feature</th>
                      <th className="lp-col-destorage">DeStorage Vault</th>
                      <th>Google Drive / Photos</th>
                      <th>Dropbox / iCloud</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Encryption Layer</strong></td>
                      <td className="lp-td-destorage"><Check size={16} /> Client-Side AES-256-GCM</td>
                      <td className="lp-td-threat">Server-Side (Company holds keys)</td>
                      <td className="lp-td-threat">Server-Side (Company holds keys)</td>
                    </tr>
                    <tr>
                      <td><strong>Master Key Custody</strong></td>
                      <td className="lp-td-destorage"><Check size={16} /> Non-Custodial (Web3 Wallet Signature)</td>
                      <td className="lp-td-threat">Custodial (Google account passwords)</td>
                      <td className="lp-td-threat">Custodial (Apple/Dropbox servers)</td>
                    </tr>
                    <tr>
                      <td><strong>AI Data Scanning & Scraping</strong></td>
                      <td className="lp-td-destorage"><Check size={16} /> Impossible (0 Plaintext Bytes)</td>
                      <td className="lp-td-threat">Yes (Scanned for AI & advertising)</td>
                      <td className="lp-td-threat">Yes (Scanned for content indexing)</td>
                    </tr>
                    <tr>
                      <td><strong>File Integrity & Tamper Proof</strong></td>
                      <td className="lp-td-destorage"><Check size={16} /> Cryptographic SHA-256 + IPFS CID</td>
                      <td className="lp-td-threat">Mutable Central Database</td>
                      <td className="lp-td-threat">Mutable Central Database</td>
                    </tr>
                    <tr>
                      <td><strong>Account Ban & File Loss Risk</strong></td>
                      <td className="lp-td-destorage"><Check size={16} /> 0% (Immutable Base L2 + IPFS)</td>
                      <td className="lp-td-threat">High (Account suspension locks files)</td>
                      <td className="lp-td-threat">High (Account suspension locks files)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </section>

        {/* ARCHITECTURE & SECURITY */}
        <section id="features" className="lp-features-section">
          <div className="lp-container">
            <div className="lp-section-header lp-reveal lp-reveal-up">
              <h2 className="lp-section-title">Our deep <span>decentralized security</span></h2>
            </div>
            
            <div className="lp-features-grid">
              <div className="lp-numbered-2x2">
                <div className="lp-numbered-item lp-card-animated lp-reveal lp-stagger-1">
                  <span className="lp-item-num">1</span>
                  <h3 className="lp-item-title">Client-Side Web Crypto</h3>
                  <p className="lp-item-desc">
                    Files are encrypted locally in browser memory with AES-256-GCM before upload. Plaintext never leaves your machine.
                  </p>
                </div>

                <div className="lp-numbered-item lp-card-animated lp-reveal lp-stagger-2">
                  <span className="lp-item-num">2</span>
                  <h3 className="lp-item-title">Envelope Key Wrapping</h3>
                  <p className="lp-item-desc">
                    Master key derived via PBKDF2 (120,000 SHA-256 iterations) from your wallet signature. Raw keys are double-encrypted.
                  </p>
                </div>

                <div className="lp-numbered-item lp-card-animated lp-reveal lp-stagger-3">
                  <span className="lp-item-num">3</span>
                  <h3 className="lp-item-title">IPFS Content Addressing</h3>
                  <p className="lp-item-desc">
                    Encrypted ciphertexts are pinned across decentralized IPFS nodes, generating immutable, tamper-proof CIDv1 hashes.
                  </p>
                </div>

                <div className="lp-numbered-item lp-card-animated lp-reveal lp-stagger-4">
                  <span className="lp-item-num">4</span>
                  <h3 className="lp-item-title">Zero-Knowledge Verification</h3>
                  <p className="lp-item-desc">
                    Sovereign cryptographic ownership: No central database, no AI scanning, and no server-side keys.
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

        {/* LIVE CRYPTO ENGINE SANDBOX */}
        <section id="crypto-demo" className="lp-sandbox-section">
          <div className="lp-container">
            
            {/* Main Sky-Blue Glassmorphic Console Card */}
            <div className="lp-sandbox-card lp-reveal lp-reveal-up">
              {/* Gradient Accent Bar (Purple-Magenta-Cyan) */}
              <div className="lp-sandbox-accent-bar" />

              {/* Console Header */}
              <div className="lp-sandbox-header">
                <div className="lp-sandbox-header-left">
                  <div className="lp-sandbox-icon-badge">
                    <Lock size={18} />
                  </div>
                  <div className="lp-sandbox-header-text">
                    <h3 className="lp-sandbox-title">Browser SubtleCrypto (AES-256-GCM) Engine</h3>
                    <p className="lp-sandbox-subtitle">Zero-knowledge client-side encryption playground</p>
                  </div>
                </div>

                <div className="lp-sandbox-status-pill">
                  <span className="lp-sandbox-live-dot" />
                  <span>Real-Time Execution</span>
                </div>
              </div>

              {/* Console Body Grid (Responsive 2-Col Desktop / 1-Col Mobile) */}
              <div className="lp-sandbox-layout">
                {/* Input Editor */}
                <div className="lp-sandbox-input-box">
                  <div className="lp-sandbox-input-header">
                    <label className="lp-sandbox-label">Plaintext Memory Buffer (Type to Encrypt)</label>
                    <span className="lp-sandbox-char-count">{demoInput.length} chars</span>
                  </div>
                  <textarea 
                    value={demoInput} 
                    onChange={(e) => setDemoInput(e.target.value)} 
                    placeholder="Type sensitive data here to watch real-time encryption..."
                    className="lp-sandbox-textarea"
                  />
                  <span className="lp-sandbox-hint">Encrypted strictly inside native browser SubtleCrypto memory before network transmission.</span>
                </div>

                {/* Output Terminal */}
                <div className="lp-sandbox-output-box">
                  <div className="lp-sandbox-out-field">
                    <div className="lp-sandbox-field-header">
                      <span className="lp-sandbox-field-tag lp-tag-purple">1. RANDOM 12-BYTE IV (NONCE)</span>
                    </div>
                    <div className="lp-sandbox-field-val lp-val-purple">{demoOutput.iv}</div>
                  </div>

                  <div className="lp-sandbox-out-field">
                    <div className="lp-sandbox-field-header">
                      <span className="lp-sandbox-field-tag lp-tag-cyan">2. ENCRYPTED AES-256-GCM CIPHERTEXT</span>
                    </div>
                    <div className="lp-sandbox-field-val lp-val-cyan">{demoOutput.ciphertext}</div>
                  </div>

                  <div className="lp-sandbox-out-field">
                    <div className="lp-sandbox-field-header">
                      <span className="lp-sandbox-field-tag lp-tag-emerald">3. CONTENT-ADDRESSED IPFS CID</span>
                    </div>
                    <div className="lp-sandbox-field-val lp-val-emerald">{demoOutput.mockCid}</div>
                  </div>
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
