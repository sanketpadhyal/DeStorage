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
    window.scrollTo(0, 0);
  };

  const handleBackToHome = () => {
    setViewMode('landing');
    window.scrollTo(0, 0);
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
