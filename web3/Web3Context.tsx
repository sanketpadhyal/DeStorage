import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { BrowserProvider, formatEther } from 'ethers';

export const BASE_SEPOLIA_CHAIN_ID = '0x14a34'; // 84532 in hex
export const BASE_SEPOLIA_DECIMAL = 84532;

export interface Web3ContextType {
  address: string | null;
  chainId: number | null;
  isBaseSepolia: boolean;
  balance: string;
  isConnecting: boolean;
  isConnected: boolean;
  isWalletModalOpen: boolean;
  hasInjectedWallet: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  connectWallet: () => Promise<boolean>;
  connectDemoWallet: () => void;
  disconnectWallet: () => Promise<void> | void;
  switchToBaseSepolia: () => Promise<void>;
  provider: BrowserProvider | null;
}

const Web3Context = createContext<Web3ContextType>({
  address: null,
  chainId: null,
  isBaseSepolia: false,
  balance: '0.0000',
  isConnecting: false,
  isConnected: false,
  isWalletModalOpen: false,
  hasInjectedWallet: false,
  openWalletModal: () => {},
  closeWalletModal: () => {},
  connectWallet: async () => {},
  connectDemoWallet: () => {},
  disconnectWallet: async () => {},
  switchToBaseSepolia: async () => {},
  provider: null,
});

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(() => {
    return localStorage.getItem('destorage_wallet_addr') || null;
  });
  const [chainId, setChainId] = useState<number | null>(() => {
    return address ? BASE_SEPOLIA_DECIMAL : null;
  });
  const [balance, setBalance] = useState<string>(() => {
    return localStorage.getItem('destorage_wallet_bal') || '0.0000';
  });
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  const hasInjectedWallet = typeof window !== 'undefined' && !!(window as any).ethereum;
  const isBaseSepolia = chainId === BASE_SEPOLIA_DECIMAL;
  const isConnected = !!address;

  const openWalletModal = () => setIsWalletModalOpen(true);
  const closeWalletModal = () => setIsWalletModalOpen(false);

  // Refresh balance
  const updateBalance = useCallback(async (userAddr: string, prov: BrowserProvider) => {
    try {
      const bal = await prov.getBalance(userAddr);
      const formatted = parseFloat(formatEther(bal)).toFixed(4);
      setBalance(formatted);
      localStorage.setItem('destorage_wallet_bal', formatted);
    } catch (e) {
      console.warn('Could not fetch balance:', e);
    }
  }, []);

  // Switch or Add Base Sepolia Network in Wallet
  const switchToBaseSepolia = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: BASE_SEPOLIA_CHAIN_ID,
                chainName: 'Base Sepolia Testnet',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.base.org'],
                blockExplorerUrls: ['https://sepolia.basescan.org'],
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add Base Sepolia network:', addError);
        }
      }
    }
  };

  // Connect Injected (MetaMask / Coinbase / Rainbow)
  const connectWallet = async (): Promise<boolean> => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setIsWalletModalOpen(true);
      return false;
    }

    try {
      setIsConnecting(true);
      localStorage.removeItem('destorage_disconnected');
      const browserProvider = new BrowserProvider(ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const network = await browserProvider.getNetwork();

      if (accounts.length > 0) {
        const userAddress = accounts[0];
        setAddress(userAddress);
        setChainId(Number(network.chainId));
        setProvider(browserProvider);
        localStorage.setItem('destorage_wallet_addr', userAddress);
        await updateBalance(userAddress, browserProvider);

        if (Number(network.chainId) !== BASE_SEPOLIA_DECIMAL) {
          await switchToBaseSepolia();
        }
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  // Connect Instant Demo / Testnet Session
  const connectDemoWallet = () => {
    localStorage.removeItem('destorage_disconnected');
    const demoAddr = '0x71C2a8F0A795C48a43fA059B6d034C74fDa88b8e';
    setAddress(demoAddr);
    setChainId(BASE_SEPOLIA_DECIMAL);
    setBalance('0.4500');
    localStorage.setItem('destorage_wallet_addr', demoAddr);
    localStorage.setItem('destorage_wallet_bal', '0.4500');
    setIsWalletModalOpen(false);
  };

  // Disconnect & Revoke MetaMask / Extension Permissions
  const disconnectWallet = async () => {
    localStorage.setItem('destorage_disconnected', 'true');
    localStorage.removeItem('destorage_wallet_addr');
    localStorage.removeItem('destorage_wallet_bal');
    setAddress(null);
    setChainId(null);
    setBalance('0.0000');
    setProvider(null);

    const ethereum = (window as any).ethereum;
    if (ethereum && ethereum.request) {
      try {
        await ethereum.request({
          method: 'wallet_revokePermissions',
          params: [
            {
              eth_accounts: {},
            },
          ],
        });
      } catch (e) {
        // Fallback for providers that don't support EIP-2255
        console.log('Permissions revoked locally.');
      }
    }
  };

  // Auto-listen to account and network changes
  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const isExplicitlyDisconnected = localStorage.getItem('destorage_disconnected') === 'true';
    const browserProvider = new BrowserProvider(ethereum);

    if (!isExplicitlyDisconnected) {
      browserProvider.send('eth_accounts', []).then(async (accounts: string[]) => {
        if (accounts && accounts.length > 0 && localStorage.getItem('destorage_disconnected') !== 'true') {
          const network = await browserProvider.getNetwork();
          setAddress(accounts[0]);
          setChainId(Number(network.chainId));
          setProvider(browserProvider);
          await updateBalance(accounts[0], browserProvider);
        }
      }).catch(() => {});
    }

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0 && localStorage.getItem('destorage_disconnected') !== 'true') {
        setAddress(accounts[0]);
        updateBalance(accounts[0], browserProvider);
      } else {
        disconnectWallet();
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      setChainId(parseInt(chainIdHex, 16));
      if (address) updateBalance(address, browserProvider);
    };

    ethereum.on?.('accountsChanged', handleAccountsChanged);
    ethereum.on?.('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
      ethereum.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [updateBalance]);

  return (
    <Web3Context.Provider
      value={{
        address,
        chainId,
        isBaseSepolia,
        balance,
        isConnecting,
        isConnected,
        isWalletModalOpen,
        hasInjectedWallet,
        openWalletModal,
        closeWalletModal,
        connectWallet,
        connectDemoWallet,
        disconnectWallet,
        switchToBaseSepolia,
        provider,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
