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
  Zap
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
      // Once loaded, convert to base64 Data URL and persist in local storage for instant future visits
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
              <button type="button" className="lp-mobile-nav-link-btn" onClick={() => scrollToSection('creator')}>
                <span>Developer Profile</span>
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
                    <div className="lp-hero-skeleton-glow" />
                    <div className="lp-hero-skeleton-shimmer" />
                    <div className="lp-hero-skeleton-ring" />
                    <div className="lp-hero-skeleton-core">
                      <div className="lp-hero-skeleton-spinner" />
                    </div>
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
                  <span className="lp-sandbox-hint">🔒 Encrypted instantly in WebAssembly / SubtleCrypto memory before network transmission.</span>
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
                    <Globe size={15} />
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
