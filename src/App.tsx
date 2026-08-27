import React, { useState } from 'react';
import { Web3Provider } from './web3/Web3Context';
import { LandingPage } from './landingpage/LandingPage';
import { VaultDashboard } from './vault/VaultDashboard';
import './App.css';

export type ViewMode = 'landing' | 'vault';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');

  const handleLaunchVault = () => {
    setViewMode('vault');
    // Scroll top inside pane after transition starts
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' as any });
    }, 50);
  };

  const handleBackToHome = () => {
    setViewMode('landing');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' as any });
    }, 50);
  };

  return (
    <Web3Provider>
      <div className="app-viewport">
        <div className={`app-slide-track ${viewMode === 'vault' ? 'show-vault' : 'show-landing'}`}>
          {/* Pane 1: Landing Page */}
          <div className="app-page-pane lp-pane">
            <LandingPage onLaunchApp={handleLaunchVault} />
          </div>

          {/* Pane 2: Vault Dashboard */}
          <div className="app-page-pane vd-pane">
            <VaultDashboard onBackToHome={handleBackToHome} />
          </div>
        </div>
      </div>
    </Web3Provider>
  );
}

export default App;
