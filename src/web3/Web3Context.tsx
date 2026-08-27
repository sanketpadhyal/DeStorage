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
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
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
  connectWallet: async () => {},
  disconnectWallet: () => {},
  switchToBaseSepolia: async () => {},
  provider: null,
});

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string>('0.0000');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  const isBaseSepolia = chainId === BASE_SEPOLIA_DECIMAL;
  const isConnected = !!address;

  // Refresh balance
  const updateBalance = useCallback(async (userAddr: string, prov: BrowserProvider) => {
    try {
      const bal = await prov.getBalance(userAddr);
      setBalance(parseFloat(formatEther(bal)).toFixed(4));
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
      // 4902 error code means the chain has not been added to MetaMask
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

  // Connect Wallet
  const connectWallet = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      alert('No Web3 wallet detected! Please install MetaMask or Coinbase Wallet extension.');
      return;
    }

    try {
      setIsConnecting(true);
      const browserProvider = new BrowserProvider(ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const network = await browserProvider.getNetwork();

      if (accounts.length > 0) {
        const userAddress = accounts[0];
        setAddress(userAddress);
        setChainId(Number(network.chainId));
        setProvider(browserProvider);
        await updateBalance(userAddress, browserProvider);

        if (Number(network.chainId) !== BASE_SEPOLIA_DECIMAL) {
          await switchToBaseSepolia();
        }
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect
  const disconnectWallet = () => {
    setAddress(null);
    setChainId(null);
    setBalance('0.0000');
    setProvider(null);
  };

  // Auto-listen to account and network changes
  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const browserProvider = new BrowserProvider(ethereum);

    // Check if already authorized
    browserProvider.send('eth_accounts', []).then(async (accounts: string[]) => {
      if (accounts && accounts.length > 0) {
        const network = await browserProvider.getNetwork();
        setAddress(accounts[0]);
        setChainId(Number(network.chainId));
        setProvider(browserProvider);
        await updateBalance(accounts[0], browserProvider);
      }
    }).catch(() => {});

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
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
  }, [address, updateBalance]);

  return (
    <Web3Context.Provider
      value={{
        address,
        chainId,
        isBaseSepolia,
        balance,
        isConnecting,
        isConnected,
        connectWallet,
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
