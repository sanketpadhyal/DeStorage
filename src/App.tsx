import React, { useState } from 'react';
import { Web3Provider } from './web3/Web3Context';
import { LandingPage } from './landingpage/LandingPage';
import { VaultDashboard } from './vault/VaultDashboard';
import './App.css';

export type ViewMode = 'landing' | 'vault';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');

  return (
    <Web3Provider>
      <div className="app-container">
        {viewMode === 'landing' ? (
          <LandingPage onLaunchApp={() => setViewMode('vault')} />
        ) : (
          <VaultDashboard onBackToHome={() => setViewMode('landing')} />
        )}
      </div>
    </Web3Provider>
  );
}

export default App;
