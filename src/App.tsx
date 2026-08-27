import React, { useState, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { Web3Provider } from './web3/Web3Context';
import { LandingPage } from './landingpage/LandingPage';
import { VaultDashboard } from './vault/VaultDashboard';
import './App.css';

export type ViewMode = 'landing' | 'vault';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    if (path.includes('vault') || search.includes('vault') || path.includes('app')) {
      return 'vault';
    }
    return 'landing';
  });

  const lenisRef = useRef<Lenis | null>(null);

  // Initialize Lenis Global Smooth Scroll Engine
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.8,
      infinite: false,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Listen to browser Back/Forward navigation buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (path.includes('vault') || search.includes('vault') || path.includes('app')) {
        setViewMode('vault');
      } else {
        setViewMode('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLaunchVault = () => {
    setViewMode('vault');
    window.history.pushState(
      { view: 'vault' },
      'DeStorage Vault | Decentralized Encrypted Storage',
      '/vault?network=base-sepolia&cipher=aes-256-gcm&protocol=ipfs'
    );
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  };

  const handleBackToHome = () => {
    setViewMode('landing');
    window.history.pushState(
      { view: 'landing' },
      'DeStorage | Decentralized Zero-Knowledge Cloud Storage',
      '/'
    );
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  };

  return (
    <Web3Provider>
      <div className="app-viewport">
        {viewMode === 'landing' ? (
          <div key="landing-view" className="app-page-view app-fade-slide-left">
            <LandingPage onLaunchApp={handleLaunchVault} />
          </div>
        ) : (
          <div key="vault-view" className="app-page-view app-fade-slide-right">
            <VaultDashboard onBackToHome={handleBackToHome} />
          </div>
        )}
      </div>
    </Web3Provider>
  );
}

export default App;
