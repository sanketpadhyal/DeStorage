import React, { useState } from 'react';
import { Web3Provider } from './web3/Web3Context';
import { LandingPage } from './landingpage/LandingPage';
import { VaultDashboard } from './vault/VaultDashboard';
import './App.css';

export type ViewMode = 'landing' | 'vault';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');

  // Auto-scroll to top when switching views
  const handleLaunchVault = () => {
    setViewMode('vault');
    window.scrollTo({ top: 0, behavior: 'instant' as any });
  };

  const handleBackToHome = () => {
    setViewMode('landing');
    window.scrollTo({ top: 0, behavior: 'instant' as any });
  };

  return (
    <Web3Provider>
      <div className="app-viewport">
        {/* Landing Page Layer (Parallax Background Push) */}
        <div className={`app-page-layer lp-layer ${viewMode === 'landing' ? 'active' : 'pushed-back'}`}>
          <LandingPage onLaunchApp={handleLaunchVault} />
        </div>

        {/* Vault Dashboard Layer (Parallax Foreground Slide & Push) */}
        <div className={`app-page-layer vd-layer ${viewMode === 'vault' ? 'active' : 'pushed-out'}`}>
          <VaultDashboard onBackToHome={handleBackToHome} />
        </div>
      </div>
    </Web3Provider>
  );
}

export default App;
