import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './VaultDashboard.css';
import { safeImages } from '../etc/safeimages';
import { useWeb3 } from '../web3/Web3Context';
import { Icon } from '@iconify/react';
import { 
  encryptFile, 
  decryptFile, 
  EncryptedFilePayload 
} from '../crypto/encryptionEngine';
import { uploadToIpfs, IpfsUploadResult } from '../ipfs/ipfsService';
import { formatFileSize, truncateCid } from '../utils/formatters';
import { VaultFileItem } from '../types';
import { Wallet, Zap, Key, Lock, ShieldCheck, RefreshCw, Folder, FolderUp, ChevronRight, ArrowLeft } from 'lucide-react';

interface VaultDashboardProps {
  onBackToHome: () => void;
}

const BaseLogoIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 115 115" fill="none">
    <circle cx="57.5" cy="57.5" r="57.5" fill="#0052FF"/>
    <path d="M57.26 89.17c17.5 0 31.68-14.18 31.68-31.67 0-17.5-14.18-31.68-31.68-31.68-14.73 0-27.14 10.05-30.73 23.69h38.31c2.19 0 3.97 1.78 3.97 3.97v8.04c0 2.19-1.78 3.97-3.97 3.97H26.53c3.59 13.64 16 23.68 30.73 23.68z" fill="#fff"/>
  </svg>
);

const MetaMaskIcon: React.FC<{ size?: number }> = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 318.6 318.6">
    <path fill="#E2761B" stroke="#E2761B" strokeMiterlimit="10" d="M274.1 35.5l-99.5 73.9L193 65.4z"/>
    <path fill="#E4761B" stroke="#E4761B" strokeMiterlimit="10" d="M44.4 35.5l98.7 74.6-17.5-44.7z"/>
    <path fill="#E4761B" stroke="#E4761B" strokeMiterlimit="10" d="M238.3 206.8l-29.6 45.4 67.9 18.7 19.5-63.4z"/>
    <path fill="#E4761B" stroke="#E4761B" strokeMiterlimit="10" d="M22.6 207.4l19.4 63.4 67.9-18.7-29.6-45.4z"/>
    <path fill="#D7C1B3" stroke="#D7C1B3" strokeMiterlimit="10" d="M198.3 179.6l-39 12.5-39-12.5 13.9-38.8 12.6 17.6h25l12.6-17.6z"/>
    <path fill="#233447" stroke="#233447" strokeMiterlimit="10" d="M198.3 179.6l-13.9-21.2h-25l-13.9 21.2 39 12.5z"/>
    <path fill="#CD6116" stroke="#CD6116" strokeMiterlimit="10" d="M110.1 233.5l29.6 45.4-30.8 14.5-28.4-41.2z"/>
    <path fill="#CD6116" stroke="#CD6116" strokeMiterlimit="10" d="M208.5 233.5l29.6 18.7-28.4 41.2-30.8-14.5z"/>
    <path fill="#E4751F" stroke="#E4751F" strokeMiterlimit="10" d="M149.3 278.9l-18.6-8.9 28.6-44.3 28.6 44.3-18.6 8.9z"/>
    <path fill="#F6851B" stroke="#F6851B" strokeMiterlimit="10" d="M86.8 111.4l18.5 44.6-28.4 41.4-32.5-12.7z"/>
    <path fill="#F6851B" stroke="#F6851B" strokeMiterlimit="10" d="M231.8 111.4l42.4 73.3-32.5 12.7-28.4-41.4z"/>
    <path fill="#C0AD9E" stroke="#C0AD9E" strokeMiterlimit="10" d="M208.7 156l-12.6 17.6h-25l-12.6-17.6 12.6-26.6h25z"/>
    <path fill="#161616" stroke="#161616" strokeMiterlimit="10" d="M134.2 147l-12.6 26.6 25 7.4 12.7-16.4z"/>
    <path fill="#763D16" stroke="#763D16" strokeMiterlimit="10" d="M174.5 109.4l18.5-44-67.6 1.4 18.5 44z"/>
    <path fill="#F6851B" stroke="#F6851B" strokeMiterlimit="10" d="M274.1 35.5l-29.6 74.6 29.6 84.7 20.3-64.8z"/>
    <path fill="#F6851B" stroke="#F6851B" strokeMiterlimit="10" d="M44.4 35.5l-20.3 94.5 20.3 64.8 29.6-84.7z"/>
  </svg>
);

const CoinbaseWalletIcon: React.FC<{ size?: number }> = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#0052FF" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM9.5 9.5H14.5C14.7761 9.5 15 9.72386 15 10V14C15 14.2761 14.7761 14.5 14.5 14.5H9.5C9.22386 14.5 9 14.2761 9 14V10C9 9.72386 9.22386 9.5 9.5 9.5Z"
      fill="white"
    />
  </svg>
);

const TrustWalletIcon: React.FC<{ size?: number }> = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="22" fill="#0500FF" />
    <path d="M50 18L76 28V46C76 63 65 77 50 82C35 77 24 63 24 46V28L50 18Z" stroke="white" strokeWidth="6" strokeLinejoin="round" fill="none"/>
  </svg>
);

export const VaultDashboard: React.FC<VaultDashboardProps> = ({ onBackToHome }) => {
  const { 
    address, 
    isConnected, 
    balance, 
    isBaseSepolia, 
    isConnecting, 
    isWalletModalOpen,
    hasInjectedWallet,
    openWalletModal,
    closeWalletModal,
    connectWallet, 
    connectDemoWallet,
    disconnectWallet, 
    switchToBaseSepolia,
    masterKey,
    unlockMasterKey 
  } = useWeb3();

  const [files, setFiles] = useState<VaultFileItem[]>([]);

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStage, setUploadStage] = useState<string>('');
  const [customPassphrase, setCustomPassphrase] = useState<string>('');
  const [batchTotal, setBatchTotal] = useState<number>(0);
  const [batchDone, setBatchDone] = useState<number>(0);
  const [uploadedBytes, setUploadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [uploadSpeed, setUploadSpeed] = useState<string>('');
  const [uploadEta, setUploadEta] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [copiedCid, setCopiedCid] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  // Preview Modal State with Permission, Live Checking, Green Tick and Decryption States
  const [previewItem, setPreviewItem] = useState<{
    file: VaultFileItem;
    previewUrl: string;
    status: 'need_permission' | 'requesting_permission' | 'permission_success' | 'decrypting' | 'ready' | 'error';
    errorMsg?: string;
  } | null>(null);

  const [isWalletClosing, setIsWalletClosing] = useState<boolean>(false);
  const [isPreviewClosing, setIsPreviewClosing] = useState<boolean>(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [isAccountClosing, setIsAccountClosing] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);

  // PhonePe-style animated connection state
  const [connectStep, setConnectStep] = useState<'idle' | 'waiting' | 'success' | 'error'>('idle');
  const [selectedWalletName, setSelectedWalletName] = useState<string>('MetaMask');
  const [selectedWalletLogo, setSelectedWalletLogo] = useState<string>(safeImages.metamask);
  const [connectErrorMsg, setConnectErrorMsg] = useState<string>('');

  // PhonePe-style animated disconnection state
  const [disconnectStep, setDisconnectStep] = useState<'idle' | 'disconnecting' | 'success'>('idle');

  const handleInitiateConnect = async (
    walletName: string,
    logo: string,
    isInstalled: boolean,
    downloadUrl: string
  ) => {
    const isMobileDevice = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

    // Mobile deep-linking to native wallet apps
    if (!isInstalled && isMobileDevice) {
      const currentPath = `${window.location.host}${window.location.pathname}${window.location.search}`;
      const fullUrl = encodeURIComponent(window.location.href);

      if (walletName.toLowerCase().includes('metamask')) {
        window.location.href = `https://metamask.app.link/dapp/${currentPath}`;
        return;
      }
      if (walletName.toLowerCase().includes('coinbase')) {
        window.location.href = `https://go.cb-w.com/dapp?cb_url=${fullUrl}`;
        return;
      }
      if (walletName.toLowerCase().includes('trust')) {
        window.location.href = `https://link.trustwallet.com/open_url?coin_id=60&url=${fullUrl}`;
        return;
      }
      if (walletName.toLowerCase().includes('rainbow')) {
        window.location.href = `https://rnbwapp.com/dapp/${currentPath}`;
        return;
      }
    }

    if (!isInstalled) {
      window.open(downloadUrl, '_blank');
      return;
    }
    setSelectedWalletName(walletName);
    setSelectedWalletLogo(logo);
    setConnectStep('waiting');
    setConnectErrorMsg('');

    try {
      const success = await connectWallet();
      if (success) {
        setConnectStep('success');
        setTimeout(() => {
          handleSmoothCloseWallet();
          setTimeout(() => setConnectStep('idle'), 350);
        }, 1600);
      } else {
        setConnectStep('error');
        setConnectErrorMsg('Connection was not completed. Please try again.');
      }
    } catch (err: any) {
      setConnectStep('error');
      const rawMsg = String(err?.message || '');
      if (err?.code === -32002 || rawMsg.includes('-32002') || rawMsg.includes('already pending')) {
        setConnectErrorMsg('A connection request is already pending in your wallet. Please click your MetaMask extension popup to approve or cancel it.');
      } else if (err?.code === 4001 || rawMsg.includes('4001') || rawMsg.includes('ACTION_REJECTED') || rawMsg.toLowerCase().includes('user rejected')) {
        setConnectErrorMsg('Connection request was cancelled by user.');
      } else {
        setConnectErrorMsg('Connection request could not be completed. Please try again.');
      }
    }
  };

  const handleInitiateDisconnect = async () => {
    setDisconnectStep('disconnecting');
    try {
      await disconnectWallet();
      setDisconnectStep('success');
      setTimeout(() => {
        handleSmoothCloseAccount();
        setTimeout(() => setDisconnectStep('idle'), 350);
      }, 1500);
    } catch (e) {
      setDisconnectStep('idle');
      handleSmoothCloseAccount();
    }
  };

  const handleSmoothCloseWallet = () => {
    setIsWalletClosing(true);
    setTimeout(() => {
      setIsWalletClosing(false);
      closeWalletModal();
      setConnectStep('idle');
    }, 300);
  };

  const handleSmoothCloseAccount = () => {
    setIsAccountClosing(true);
    setTimeout(() => {
      setIsAccountClosing(false);
      setIsAccountModalOpen(false);
    }, 300);
  };

  const handleCopyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleSmoothClosePreview = () => {
    setIsPreviewClosing(true);
    setTimeout(() => {
      setIsPreviewClosing(false);
      setPreviewItem(null);
    }, 300);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  // Guard: prevent persist effect from running with initial empty state and wiping localStorage
  const filesLoadedRef = useRef<boolean>(false);

  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<string>('');
  const [isFetchingCloudFiles, setIsFetchingCloudFiles] = useState<boolean>(false);

  // Handle Full Cross-Device Cloud Sync with Wallet Signature
  const handleSyncToDevices = async () => {
    if (!isConnected || !address) {
      openWalletModal();
      return;
    }
    try {
      setIsCloudSyncing(true);
      setCloudSyncStatus('Requesting Master Signature...');

      const key = masterKey || (await unlockMasterKey(address));
      if (!key) {
        setIsCloudSyncing(false);
        setCloudSyncStatus('');
        return;
      }

      setCloudSyncStatus('Syncing Encrypted Vault to IPFS Cloud...');
      const { syncVaultToCloud, fetchVaultFromCloud } = await import('../crypto/vaultSyncService');
      
      // 1. Check cloud for existing/newer files first
      const cloudFiles = await fetchVaultFromCloud(address, key);
      let mergedFiles = [...files];

      if (cloudFiles && cloudFiles.length > 0) {
        const existingIds = new Set(files.map(f => f.id));
        const newFromCloud = cloudFiles.filter(f => !existingIds.has(f.id));
        if (newFromCloud.length > 0) {
          mergedFiles = [...newFromCloud, ...files];
          setFiles(mergedFiles);
        }
      }

      // 2. Upload latest merged registry to cloud
      await syncVaultToCloud(address, mergedFiles, key);
      setCloudSyncStatus('Synced & Ready on All Devices!');
      setTimeout(() => {
        setIsCloudSyncing(false);
        setCloudSyncStatus('');
      }, 2500);
    } catch (e: any) {
      console.warn('Sync failed:', e);
      setIsCloudSyncing(false);
      setCloudSyncStatus('');
    }
  };

  // Load files strictly scoped to the active connected wallet & Auto-Restore from Pinata Cloud
  useEffect(() => {
    if (isConnected && address) {
      const walletKey = `destorage_vault_files_${address.toLowerCase()}`;
      const saved = localStorage.getItem(walletKey);
      let hasLocal = false;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFiles(parsed);
            hasLocal = true;
            filesLoadedRef.current = true;
          }
        } catch (e) {}
      }

      // Show skeleton loading if we don't have local cache
      if (!hasLocal) {
        setIsFetchingCloudFiles(true);
      }

      // Always query Pinata Cloud — authoritative source across all devices
      import('../ipfs/ipfsService').then(({ fetchWalletFilesFromPinata }) => {
        fetchWalletFilesFromPinata(address, undefined, masterKey).then((cloudFiles) => {
          if (cloudFiles && cloudFiles.length > 0) {
            filesLoadedRef.current = true;
            setFiles(prev => {
              // Build a map of existing files by CID to preserve any local-only state
              const existingByIpfsCid = new Map(prev.map(f => [f.ipfsCid, f]));
              // Merge: cloud files are authoritative for metadata; preserve local encryptedBuffer if present
              const merged = cloudFiles.map(cf => {
                const local = existingByIpfsCid.get(cf.ipfsCid);
                return local ? { ...cf, encryptedBuffer: local.encryptedBuffer } : cf;
              });
              // Preserve local-only files not yet in Pinata (just uploaded, mid-sync)
              const cloudCids = new Set(cloudFiles.map(f => f.ipfsCid));
              const localOnly = prev.filter(f => !cloudCids.has(f.ipfsCid));
              const final = [...merged, ...localOnly];
              localStorage.setItem(walletKey, JSON.stringify(final.map(f => ({ ...f, encryptedBuffer: undefined }))));
              return final;
            });
          }
          // Never call setFiles([]) from cloud sync — if Pinata returns nothing,
          // keep whatever files are already in state (local cache or in-progress uploads).
          // An empty vault is already the initial default state.
        }).catch(() => {}).finally(() => {
          setIsFetchingCloudFiles(false);
          filesLoadedRef.current = true;
        });
      });
    } else {
      // Wallet disconnected: clear active files for Zero-Knowledge privacy
      filesLoadedRef.current = false;
      setFiles([]);
      setIsFetchingCloudFiles(false);
    }
  }, [isConnected, address, masterKey]);

  // Persist files strictly scoped to active wallet & background sync
  // Guard: only run after files have been loaded from localStorage or cloud — never on initial empty mount
  useEffect(() => {
    if (!filesLoadedRef.current) return;
    if (isConnected && address) {
      const walletKey = `destorage_vault_files_${address.toLowerCase()}`;
      const metadataOnly = files.map(f => ({
        ...f,
        encryptedBuffer: undefined, // exclude buffer from JSON storage
      }));
      localStorage.setItem(walletKey, JSON.stringify(metadataOnly));
    }
  }, [files, isConnected, address]);

  // Dynamic document title reacting to vault activity (uploading, decrypting, files count)
  useEffect(() => {
    if (isUploading) {
      if (batchTotal > 1) {
        document.title = `(${batchDone + 1}/${batchTotal}) Uploading to IPFS... | DeStorage`;
      } else if (totalBytes > 0) {
        const pct = Math.min(100, Math.round((uploadedBytes / totalBytes) * 100));
        document.title = `(${pct}%) Encrypting & Uploading... | DeStorage`;
      } else {
        document.title = 'Encrypting & Storing to IPFS... | DeStorage';
      }
    } else if (previewItem?.status === 'decrypting') {
      document.title = `Decrypting ${previewItem.file.name}... | DeStorage`;
    } else if (previewItem?.status === 'requesting_permission') {
      document.title = 'Authorizing Signature... | DeStorage';
    } else if (isConnected && address) {
      document.title = `DeStorage Vault (${files.length} files) | Zero-Knowledge Cloud`;
    } else {
      document.title = 'DeStorage Vault | Decentralized Encrypted Storage';
    }
  }, [isUploading, batchTotal, batchDone, uploadedBytes, totalBytes, previewItem, files.length, isConnected, address]);

  // Update browser URL query params dynamically based on wallet state
  useEffect(() => {
    if (isConnected && address) {
      window.history.replaceState(
        { view: 'vault', auth: address },
        'DeStorage Vault | Zero-Knowledge Session',
        `/vault?network=base-sepolia&auth=${address.slice(0, 6)}...${address.slice(-4)}&linked=yes&cipher=aes-256-gcm&protocol=ipfs`
      );
    } else {
      window.history.replaceState(
        { view: 'vault' },
        'DeStorage Vault | Decentralized Encrypted Storage',
        '/vault?network=base-sepolia&linked=no&cipher=aes-256-gcm&protocol=ipfs'
      );
    }
  }, [isConnected, address]);

  // Helper: Recursively extract files from Drag & Drop entries (including folders)
  const extractFilesFromDataTransfer = async (dataTransfer: DataTransfer): Promise<File[]> => {
    const files: File[] = [];

    if (dataTransfer.items && dataTransfer.items.length > 0) {
      const entries: any[] = [];
      for (let i = 0; i < dataTransfer.items.length; i++) {
        const item = dataTransfer.items[i];
        if (item.kind === 'file') {
          const entry = (item as any).webkitGetAsEntry ? (item as any).webkitGetAsEntry() : null;
          if (entry) entries.push(entry);
        }
      }

      if (entries.length > 0) {
        const readEntry = async (entry: any, currentPath = ''): Promise<void> => {
          if (entry.isFile) {
            await new Promise<void>((resolve) => {
              entry.file((file: File) => {
                const fullPath = currentPath ? `${currentPath}/${file.name}` : file.name;
                try {
                  Object.defineProperty(file, 'webkitRelativePath', {
                    value: fullPath,
                    writable: true,
                    configurable: true,
                  });
                } catch (e) {}
                files.push(file);
                resolve();
              }, () => resolve());
            });
          } else if (entry.isDirectory) {
            const dirReader = entry.createReader();
            const readAllEntries = async (): Promise<any[]> => {
              let allEntries: any[] = [];
              let batch: any[] = [];
              do {
                batch = await new Promise<any[]>((resolve) => {
                  dirReader.readEntries((res: any[]) => resolve(res || []), () => resolve([]));
                });
                allEntries = allEntries.concat(batch);
              } while (batch.length > 0);
              return allEntries;
            };

            const childEntries = await readAllEntries();
            for (const child of childEntries) {
              await readEntry(child, currentPath ? `${currentPath}/${entry.name}` : entry.name);
            }
          }
        }

        for (const entry of entries) {
          await readEntry(entry);
        }

        if (files.length > 0) return files;
      }
    }

    if (dataTransfer.files && dataTransfer.files.length > 0) {
      return Array.from(dataTransfer.files);
    }

    return [];
  };

  // Upload a batch of files (from multi-file select, folder select, or drag & drop)
  const uploadBatchFiles = async (allFiles: File[]) => {
    if (!isConnected || !address) {
      openWalletModal();
      return;
    }
    if (allFiles.length === 0) return;

    // Support up to 30 files at once in a folder / batch
    const MAX_FILES = 30;
    if (allFiles.length > MAX_FILES) {
      alert(`Uploading the first ${MAX_FILES} files from your selection (${allFiles.length} total found).`);
    }
    const batch = allFiles.slice(0, MAX_FILES);

    if (batch.length === 1) {
      await processFileUpload(batch[0]);
      return;
    }

    setBatchTotal(batch.length);
    setBatchDone(0);
    setIsUploading(true);
    for (let i = 0; i < batch.length; i++) {
      setBatchDone(i);
      await processFileUpload(batch[i], true);
    }
    setBatchDone(batch.length);
    setUploadStage(`${batch.length} files encrypted & stored!`);
    setTimeout(() => {
      setIsUploading(false);
      setUploadStage('');
      setBatchTotal(0);
      setBatchDone(0);
    }, 1500);
  };

  // Handle Drag & Drop Upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    if (!isConnected || !address) {
      openWalletModal();
      return;
    }
    let allFiles: File[] = [];

    if ('dataTransfer' in e) {
      e.preventDefault();
      allFiles = await extractFilesFromDataTransfer(e.dataTransfer);
    } else if (e.target.files) {
      allFiles = Array.from(e.target.files);
      e.target.value = '';
    }

    if (allFiles.length === 0) return;
    await uploadBatchFiles(allFiles);
  };

  // Handle Folder Upload Selector
  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isConnected || !address) {
      openWalletModal();
      return;
    }
    if (!e.target.files || e.target.files.length === 0) return;
    const allFiles = Array.from(e.target.files);
    e.target.value = '';
    await uploadBatchFiles(allFiles);
  };

  const processFileUpload = async (file: File, isBatch = false) => {
    if (!isConnected || !address) {
      openWalletModal();
      return;
    }
    try {
      if (!isBatch) setIsUploading(true);

      const displayName = file.webkitRelativePath || file.name;

      // Step 1: Encrypt File locally in browser memory
      const encryptedData: EncryptedFilePayload = await encryptFile(
        file,
        customPassphrase,
        (stage) => setUploadStage(isBatch ? `${displayName}: ${stage}` : stage)
      );

      // Step 1.5: Envelope Encryption: Wrap the File Key with the user's Master Key (if available)
      let activeMasterKey = masterKey;
      if (!activeMasterKey && isConnected && address && hasInjectedWallet && !customPassphrase) {
        try {
          activeMasterKey = await unlockMasterKey(address);
        } catch (e) {
          console.warn('Master key unlock skipped:', e);
        }
      }

      let wrappedInfo: { wrappedKeyHex: string; wrapIvHex: string } | null = null;
      if (activeMasterKey && !customPassphrase) {
        const { wrapKeyWithMasterKey } = await import('../crypto/encryptionEngine');
        wrappedInfo = await wrapKeyWithMasterKey(encryptedData.keyHex, activeMasterKey);
      }

      // Step 2: Upload to decentralized IPFS with full sovereign cloud metadata
      setUploadStage(isBatch ? `${displayName}: Pinning to IPFS...` : 'Pinning to IPFS...');
      setUploadedBytes(0);
      setTotalBytes(encryptedData.encryptedBuffer.byteLength);
      setUploadSpeed('');
      setUploadEta('');
      const uploadStartTime = Date.now();
      const ipfsResult: IpfsUploadResult = await uploadToIpfs(
        encryptedData.encryptedBuffer,
        displayName,
        {
          ownerAddress: address,
          originalSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          keyHex: wrappedInfo ? wrappedInfo.wrappedKeyHex : encryptedData.keyHex,
          ivHex: encryptedData.ivHex,
          sha256Hash: encryptedData.sha256Hash,
          isKeyWrapped: !!wrappedInfo,
          wrapIvHex: wrappedInfo ? wrappedInfo.wrapIvHex : undefined,
        },
        undefined,
        (loaded, total) => {
          setUploadedBytes(loaded);
          setTotalBytes(total);
          const elapsedSec = (Date.now() - uploadStartTime) / 1000;
          if (elapsedSec > 0.3 && loaded > 0) {
            const bytesPerSec = loaded / elapsedSec;
            const mbPerSec = bytesPerSec / (1024 * 1024);
            setUploadSpeed(mbPerSec >= 1 ? `${mbPerSec.toFixed(1)} MB/s` : `${(bytesPerSec / 1024).toFixed(0)} KB/s`);
            const remainingBytes = total - loaded;
            const etaSec = Math.ceil(remainingBytes / bytesPerSec);
            if (etaSec > 0 && etaSec < 3600) {
              setUploadEta(etaSec < 60 ? `~${etaSec}s left` : `~${Math.ceil(etaSec / 60)}m left`);
            } else {
              setUploadEta('');
            }
          }
        }
      );

      // Step 3: Register in Vault
      const newVaultItem: VaultFileItem = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: displayName,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        ipfsCid: ipfsResult.cid,
        sha256Hash: encryptedData.sha256Hash,
        keyHex: encryptedData.keyHex,
        ivHex: encryptedData.ivHex,
        wrappedKeyHex: wrappedInfo ? wrappedInfo.wrappedKeyHex : undefined,
        wrapIvHex: wrappedInfo ? wrappedInfo.wrapIvHex : undefined,
        isKeyWrapped: false, // already unwrapped in local memory
        timestamp: Date.now(),
        encryptedBuffer: encryptedData.encryptedBuffer,
      };

      setFiles(prev => [newVaultItem, ...prev]);
      if (!isBatch) {
        setCustomPassphrase('');
        setUploadStage('Upload & Encryption Complete!');
        setTimeout(() => {
          setIsUploading(false);
          setUploadStage('');
        }, 1000);
      }
    } catch (err: any) {
      console.error('File encryption & upload failed:', err);
      if (!isBatch) {
        alert(`Encryption error: ${err.message || 'Failed to process file'}`);
        setIsUploading(false);
        setUploadStage('');
      } else {
        console.warn(`Batch: skipping ${file.name} — ${err.message}`);
      }
    }
  };

  // Decrypt and Download file
  const handleDecryptDownload = async (item: VaultFileItem) => {
    try {
      let rawKeyHex = item.keyHex;

      // If the key is still wrapped (e.g. freshly recovered on a new device)
      if (item.isKeyWrapped && item.wrappedKeyHex && item.wrapIvHex) {
        let activeMasterKey = masterKey;
        if (!activeMasterKey && address) {
          activeMasterKey = await unlockMasterKey(address);
        }
        if (!activeMasterKey) {
          alert('Please approve the signature in your wallet to unlock and decrypt your files.');
          return;
        }
        const { unwrapKeyWithMasterKey } = await import('../crypto/encryptionEngine');
        rawKeyHex = await unwrapKeyWithMasterKey(item.wrappedKeyHex, item.wrapIvHex, activeMasterKey);
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, keyHex: rawKeyHex, isKeyWrapped: false } : f));
      }

      let buffer = item.encryptedBuffer;
      if (!buffer) {
        const { fetchFromIpfs } = await import('../ipfs/ipfsService');
        buffer = await fetchFromIpfs(item.ipfsCid);
      }

      const { decryptedBlob } = await decryptFile(
        buffer,
        rawKeyHex,
        item.ivHex,
        item.mimeType
      );

      const downloadUrl = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = item.name.split('/').pop() || item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(`Decryption failed: ${err.message || 'Invalid key or corrupted data'}`);
    }
  };

  // Decrypt and Preview file in-memory
  const handlePreview = async (item: VaultFileItem) => {
    // If the file is key-wrapped and masterKey has not yet been unlocked in this session
    const needsPermission = Boolean(item.isKeyWrapped && item.wrappedKeyHex && !masterKey);

    if (needsPermission) {
      setPreviewItem({
        file: item,
        previewUrl: '',
        status: 'need_permission',
      });
      return;
    }

    // Otherwise, immediately execute in-memory decryption
    await executeDecryption(item, masterKey);
  };

  // Execute in-memory decryption pipeline
  const executeDecryption = async (item: VaultFileItem, activeMasterKey: CryptoKey | null) => {
    setPreviewItem({
      file: item,
      previewUrl: '',
      status: 'decrypting',
    });

    try {
      let rawKeyHex = item.keyHex;

      // Unwrap wrapped file key if needed
      if (item.isKeyWrapped && item.wrappedKeyHex && item.wrapIvHex && activeMasterKey) {
        const { unwrapKeyWithMasterKey } = await import('../crypto/encryptionEngine');
        rawKeyHex = await unwrapKeyWithMasterKey(item.wrappedKeyHex, item.wrapIvHex, activeMasterKey);
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, keyHex: rawKeyHex, isKeyWrapped: false } : f));
      }

      let buffer = item.encryptedBuffer;
      if (!buffer) {
        const { fetchFromIpfs } = await import('../ipfs/ipfsService');
        buffer = await fetchFromIpfs(item.ipfsCid);
      }

      const { objectUrl } = await decryptFile(
        buffer,
        rawKeyHex,
        item.ivHex,
        item.mimeType
      );

      setPreviewItem({
        file: { ...item, keyHex: rawKeyHex, isKeyWrapped: false },
        previewUrl: objectUrl,
        status: 'ready',
      });
    } catch (err: any) {
      console.error('Decryption failed:', err);
      setPreviewItem({
        file: item,
        previewUrl: '',
        status: 'error',
        errorMsg: err?.message || 'Could not decrypt file in browser memory.',
      });
    }
  };

  // Handle User Clicking "Ask for Permission" in Preview Modal
  const handleRequestPermission = async () => {
    if (!previewItem) return;
    const item = previewItem.file;

    setPreviewItem(prev => prev ? { ...prev, status: 'requesting_permission', errorMsg: '' } : null);

    try {
      let activeMasterKey = masterKey;
      if (!activeMasterKey && address) {
        activeMasterKey = await unlockMasterKey(address);
      }

      if (!activeMasterKey) {
        setPreviewItem(prev => prev ? {
          ...prev,
          status: 'error',
          errorMsg: 'Wallet signature request was cancelled or not completed.',
        } : null);
        return;
      }

      // Show satisfying PhonePe-style green tick
      setPreviewItem(prev => prev ? { ...prev, status: 'permission_success' } : null);

      // Brief pause for the green tick animation
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Proceed to decryption
      await executeDecryption(item, activeMasterKey);
    } catch (err: any) {
      const rawMsg = String(err?.message || '');
      const isRejected = err?.code === 4001 || rawMsg.includes('4001') || rawMsg.toLowerCase().includes('user rejected') || rawMsg.toLowerCase().includes('cancelled');
      setPreviewItem(prev => prev ? {
        ...prev,
        status: 'error',
        errorMsg: isRejected ? 'Signature permission request was cancelled by user.' : (err?.message || 'Failed to authorize wallet signature.'),
      } : null);
    }
  };

  const closePreview = () => {
    if (previewItem && previewItem.previewUrl) {
      URL.revokeObjectURL(previewItem.previewUrl);
    }
    setPreviewItem(null);
  };

  const handleDelete = async (id: string) => {
    const fileToDelete = files.find(f => f.id === id);
    if (!fileToDelete) return;

    if (window.confirm(`Permanently delete "${fileToDelete.name}" from your vault and IPFS cloud?`)) {
      const remaining = files.filter(f => f.id !== id);
      setFiles(remaining);

      if (address) {
        const walletKey = `destorage_vault_files_${address.toLowerCase()}`;
        localStorage.setItem(walletKey, JSON.stringify(remaining));

        // Record in deleted CIDs registry so cloud auto-recovery never resurrects it
        const delKey = `destorage_deleted_${address.toLowerCase()}`;
        try {
          const delCids = JSON.parse(localStorage.getItem(delKey) || '[]');
          if (Array.isArray(delCids) && !delCids.includes(fileToDelete.ipfsCid)) {
            delCids.push(fileToDelete.ipfsCid);
            localStorage.setItem(delKey, JSON.stringify(delCids));
          }
        } catch (e) {}
      }

      // Unpin permanently from Pinata IPFS Cloud
      if (fileToDelete.ipfsCid) {
        try {
          const { unpinFromIpfs } = await import('../ipfs/ipfsService');
          await unpinFromIpfs(fileToDelete.ipfsCid);
        } catch (e) {
          console.warn('Cloud unpin error:', e);
        }
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const toDelete = files.filter(f => selectedIds.has(f.id));
    if (!window.confirm(`Permanently delete ${toDelete.length} file${toDelete.length > 1 ? 's' : ''} from your vault and IPFS cloud?`)) return;

    const remaining = files.filter(f => !selectedIds.has(f.id));
    setFiles(remaining);
    setSelectedIds(new Set());
    setIsSelecting(false);

    if (address) {
      const walletKey = `destorage_vault_files_${address.toLowerCase()}`;
      localStorage.setItem(walletKey, JSON.stringify(remaining));

      const delKey = `destorage_deleted_${address.toLowerCase()}`;
      try {
        const existingDel: string[] = JSON.parse(localStorage.getItem(delKey) || '[]');
        const delSet = new Set<string>(existingDel);
        for (const f of toDelete) {
          if (f.ipfsCid) delSet.add(f.ipfsCid);
        }
        localStorage.setItem(delKey, JSON.stringify(Array.from(delSet)));
      } catch (e) {}
    }

    // Unpin all from Pinata IPFS Cloud
    const { unpinFromIpfs } = await import('../ipfs/ipfsService');
    for (const f of toDelete) {
      if (f.ipfsCid) {
        try { await unpinFromIpfs(f.ipfsCid); } catch (e) { console.warn('Unpin error:', e); }
      }
    }
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string, cid: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCid(cid);
    setTimeout(() => setCopiedCid(null), 2000);
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <Icon icon="iconamoon:file-image-bold" width={22} height={22} color="#0284c7" />;
    if (mime.startsWith('video/')) return <Icon icon="iconamoon:file-video-bold" width={22} height={22} color="#db2777" />;
    if (mime.startsWith('audio/')) return <Icon icon="iconamoon:file-audio-bold" width={22} height={22} color="#7c3aed" />;
    if (mime.includes('pdf') || mime.includes('document') || mime.includes('text')) {
      return <Icon icon="iconamoon:file-document-bold" width={22} height={22} color="#16a34a" />;
    }
    return <Icon icon="iconamoon:file-bold" width={22} height={22} color="#475569" />;
  };

  // Filter files with O(n) memoized evaluation
  const filteredFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return files.filter(f => {
      if (q && !f.name.toLowerCase().includes(q) && !f.ipfsCid.toLowerCase().includes(q)) {
        return false;
      }
      if (selectedFilter === 'photos') return f.mimeType.startsWith('image/');
      if (selectedFilter === 'docs') return f.mimeType.includes('pdf') || f.mimeType.includes('text') || f.mimeType.includes('document');
      if (selectedFilter === 'media') return f.mimeType.startsWith('video/') || f.mimeType.startsWith('audio/');
      return true;
    });
  }, [files, searchQuery, selectedFilter]);

  // Group files into Folders and Standalone Root Files in O(n)
  const { folderGroups, rootFiles, currentFolderFiles, totalFolderCount } = useMemo(() => {
    const folderMap = new Map<string, VaultFileItem[]>();
    const root: VaultFileItem[] = [];

    for (const file of filteredFiles) {
      if (file.name.includes('/')) {
        const folderName = file.name.split('/')[0];
        if (!folderMap.has(folderName)) {
          folderMap.set(folderName, []);
        }
        folderMap.get(folderName)!.push(file);
      } else {
        root.push(file);
      }
    }

    const folders: Array<{
      name: string;
      files: VaultFileItem[];
      totalSize: number;
      latestTimestamp: number;
    }> = [];

    folderMap.forEach((fList, name) => {
      const totalSize = fList.reduce((sum, f) => sum + (f.size || 0), 0);
      const latestTimestamp = fList.reduce((max, f) => Math.max(max, f.timestamp || 0), 0);
      folders.push({
        name,
        files: fList,
        totalSize,
        latestTimestamp,
      });
    });

    folders.sort((a, b) => b.latestTimestamp - a.latestTimestamp);

    const currFiles = currentFolder ? (folderMap.get(currentFolder) || []) : [];

    return {
      folderGroups: folders,
      rootFiles: root,
      currentFolderFiles: currFiles,
      totalFolderCount: folders.length,
    };
  }, [filteredFiles, currentFolder]);

  // Handle Deleting an entire folder and all contained files
  const handleDeleteFolder = async (folderName: string, folderFiles: VaultFileItem[], e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove the entire folder "${folderName}" (${folderFiles.length} files)?`)) {
      return;
    }

    const idsToDelete = new Set(folderFiles.map(f => f.id));
    const cidsToDelete = new Set(folderFiles.map(f => f.ipfsCid));

    setFiles(prev => prev.filter(f => !idsToDelete.has(f.id)));

    if (currentFolder === folderName) {
      setCurrentFolder(null);
    }

    try {
      const { unpinFromIpfs } = await import('../ipfs/ipfsService');
      folderFiles.forEach(f => {
        unpinFromIpfs(f.ipfsCid).catch(() => {});
      });
    } catch (err) {}
  };

  const totalStorageBytes = useMemo(() => {
    return files.reduce((acc, curr) => acc + (curr.size || 0), 0);
  }, [files]);

  return (
    <div className="vd-root">
      
      {/* 1. TOP VAULT NAVBAR */}
      <header className="vd-navbar">
        <div className="vd-container vd-nav-inner">
          <div className="vd-brand-group">
            <button 
              type="button" 
              className="vd-back-btn" 
              onClick={onBackToHome}
              aria-label="Back to Landing Page"
              title="Back to Landing Page"
            >
              <Icon icon="iconamoon:arrow-left-2-bold" width={24} height={24} />
            </button>

            <div className="vd-brand">
              <img src={safeImages.logo} alt="DeStorage Logo" draggable={false} />
              <span>De<span className="vd-brand-accent">Storage</span></span>
            </div>
          </div>

          <div className="vd-nav-actions">
            {/* Base Sepolia Live Network Pill */}
            <div className="vd-network-pill">
              <BaseLogoIcon size={16} />
              <span>Base Sepolia</span>
            </div>

            {isConnected && address ? (
              <button 
                type="button" 
                className="vd-btn-wallet-active"
                onClick={() => setIsAccountModalOpen(true)}
                title="View Connected Account & Session Details"
              >
                <div className="vd-wallet-dot-pulse" />
                <span className="vd-wallet-icon-wrap">
                  <Wallet size={15} />
                </span>
                <span className="vd-wallet-connected-text">
                  <span className="vd-wallet-status-label">Connected</span>
                  <span className="vd-wallet-addr-pill">{`${address.slice(0, 4)}...${address.slice(-4)}`}</span>
                </span>
                <Icon icon="iconamoon:arrow-down-2-bold" width={13} height={13} className="vd-wallet-chevron" />
              </button>
            ) : (
              <button 
                type="button" 
                className="vd-btn-connect" 
                disabled={isConnecting}
                onClick={openWalletModal}
              >
                <Wallet size={17} />
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN DASHBOARD CONTENT */}
      <main className="vd-main-content">
        <div className="vd-container">
          
          {/* LIVE SESSION PARAMS BAR */}
          <div className="vd-session-bar">
            <div className="vd-session-pill">
              <span className="vd-session-dot vd-dot-blue" />
              <span className="vd-session-key">network:</span>
              <span className="vd-session-val">base-sepolia</span>
            </div>

            <div className={`vd-session-pill ${isConnected ? 'vd-pill-linked-yes' : 'vd-pill-linked-no'}`}>
              <span className={`vd-session-dot ${isConnected ? 'vd-dot-green' : 'vd-dot-amber'}`} />
              <span className="vd-session-key">linked:</span>
              <span className="vd-session-val">{isConnected ? `yes (${address?.slice(0, 6)}...${address?.slice(-4)})` : 'no'}</span>
            </div>

            <div className="vd-session-pill">
              <span className="vd-session-dot vd-dot-purple" />
              <span className="vd-session-key">cipher:</span>
              <span className="vd-session-val">aes-256-gcm</span>
            </div>

            <div className="vd-session-pill">
              <span className="vd-session-dot vd-dot-cyan" />
              <span className="vd-session-key">protocol:</span>
              <span className="vd-session-val">ipfs</span>
            </div>
          </div>

          {/* STATS OVERVIEW CARDS (Premium Multi-Color Gradient Suite) */}
          <div className="vd-stats-grid">
            <div className="vd-stat-card vd-card-blue">
              <div className="vd-stat-icon vd-icon-blue">
                <Icon icon="iconamoon:lock-bold" width={22} height={22} />
              </div>
              <div className="vd-stat-info">
                <span className="vd-stat-label">Encrypted Files</span>
                <span className="vd-stat-value">{files.length}</span>
              </div>
            </div>

            <div className="vd-stat-card vd-card-emerald">
              <div className="vd-stat-icon vd-icon-emerald">
                <Icon icon="iconamoon:folder-check-bold" width={22} height={22} />
              </div>
              <div className="vd-stat-info">
                <span className="vd-stat-label">Storage Consumed</span>
                <span className="vd-stat-value">{formatFileSize(totalStorageBytes)}</span>
              </div>
            </div>


          </div>

          {/* UPLOAD & ENCRYPT DROPZONE */}
          <div 
            className={`vd-upload-card ${isUploading ? 'vd-upload-card-active' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileSelect}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              multiple
              onChange={handleFileSelect} 
            />
            <input 
              type="file" 
              ref={folderInputRef} 
              style={{ display: 'none' }} 
              multiple
              {...({ webkitdirectory: '', directory: '', mozdirectory: '' } as any)}
              onChange={handleFolderSelect} 
            />

            {isUploading ? (
              /* ── FULL-PANEL UPLOADING STATE ── */
              <div className="vd-uploading-panel">
                <div className="vd-uploading-radar-box">
                  <div className="vd-uploading-glow-bg" />
                  <div className="vd-uploading-radar-ring" />
                  <div className="vd-uploading-radar-core">
                    <Icon icon="iconamoon:cloud-upload-bold" width={26} height={26} color="#0284c7" />
                  </div>
                </div>

                <div className="vd-uploading-info">
                  <h3 className="vd-uploading-title">
                    {batchTotal > 1 ? `Encrypting & Uploading ${batchDone + 1} of ${batchTotal}` : 'Encrypting & Uploading'}
                  </h3>
                  <p className="vd-uploading-stage">{uploadStage}</p>
                </div>

                {/* Real-time byte progress bar */}
                {totalBytes > 0 && (
                  <div className="vd-uploading-progress-wrap">
                    <div className="vd-uploading-progress-track">
                      <div 
                        className="vd-uploading-progress-fill"
                        style={{ width: `${Math.min(100, Math.round((uploadedBytes / totalBytes) * 100))}%` }}
                      />
                    </div>
                    <div className="vd-uploading-progress-labels">
                      <span className="vd-uploading-counter">
                        {(uploadedBytes / 1048576).toFixed(2)} MB / {(totalBytes / 1048576).toFixed(2)} MB
                      </span>
                      <div className="vd-uploading-right-meta">
                        {uploadSpeed && <span className="vd-uploading-speed-tag">{uploadSpeed}</span>}
                        {uploadEta && <span className="vd-uploading-eta-tag">{uploadEta}</span>}
                        <span className="vd-uploading-pct">
                          {Math.min(100, Math.round((uploadedBytes / totalBytes) * 100))}%
                        </span>
                      </div>
                    </div>
                    {batchTotal > 1 && (
                      <span className="vd-uploading-batch-label">{batchDone} of {batchTotal} files done</span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* ── IDLE DROPZONE ── */
              <div className="vd-upload-inner">
                <div className="vd-upload-icon-box">
                  <Icon icon="iconamoon:cloud-upload-bold" width={40} height={40} color="#0284c7" />
                </div>

                <div className="vd-upload-texts">
                  <h3 className="vd-upload-title">Drag & drop files or folders to encrypt</h3>
                  <p className="vd-upload-desc">
                    Upload individual files or <strong>entire folders</strong>. Every file is AES-256-GCM encrypted locally in memory before IPFS storage.
                  </p>
                </div>

                <div className="vd-upload-actions-row">
                  <button 
                    type="button" 
                    className="vd-btn-select-file" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Icon icon="iconamoon:file-bold" width={18} height={18} />
                    <span>Upload Files</span>
                  </button>

                  <button 
                    type="button" 
                    className="vd-btn-select-folder" 
                    onClick={() => folderInputRef.current?.click()}
                  >
                    <FolderUp size={18} />
                    <span>Upload Folder</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* VAULT FILE EXPLORER */}
          <div className="vd-files-section">
            <div className="vd-files-header">
              <div className="vd-files-title-row">
                <h3 className="vd-section-title">
                  {currentFolder ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <Folder size={20} color="#0284c7" />
                      <span>{currentFolder}</span>
                    </span>
                  ) : (
                    'Encrypted Vault Storage'
                  )}
                </h3>
                <span className="vd-files-count">
                  {currentFolder ? `${currentFolderFiles.length} files` : `${filteredFiles.length} files`}
                </span>
                {!currentFolder && totalFolderCount > 0 && (
                  <span className="vd-folder-total-badge">
                    {totalFolderCount} {totalFolderCount === 1 ? 'folder' : 'folders'}
                  </span>
                )}
                {filteredFiles.length > 0 && (
                  <button
                    type="button"
                    className={`vd-select-toggle-btn ${isSelecting ? 'active' : ''}`}
                    onClick={() => { setIsSelecting(v => !v); setSelectedIds(new Set()); }}
                  >
                    {isSelecting ? 'Cancel' : 'Select'}
                  </button>
                )}
              </div>

              <div className="vd-files-controls">
                <div className="vd-search-box">
                  <Icon icon="iconamoon:search-bold" width={16} height={16} color="#94a3b8" />
                  <input 
                    type="text" 
                    placeholder="Search by file name or CID..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="vd-filter-tabs">
                  <button 
                    type="button" 
                    className={`vd-filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
                    onClick={() => { setSelectedFilter('all'); }}
                  >
                    All
                  </button>
                  {totalFolderCount > 0 && !currentFolder && (
                    <button 
                      type="button" 
                      className={`vd-filter-btn ${selectedFilter === 'folders' ? 'active' : ''}`}
                      onClick={() => setSelectedFilter('folders')}
                    >
                      Folders ({totalFolderCount})
                    </button>
                  )}
                  <button 
                    type="button" 
                    className={`vd-filter-btn ${selectedFilter === 'photos' ? 'active' : ''}`}
                    onClick={() => setSelectedFilter('photos')}
                  >
                    Photos
                  </button>
                  <button 
                    type="button" 
                    className={`vd-filter-btn ${selectedFilter === 'docs' ? 'active' : ''}`}
                    onClick={() => setSelectedFilter('docs')}
                  >
                    Docs
                  </button>
                  <button 
                    type="button" 
                    className={`vd-filter-btn ${selectedFilter === 'media' ? 'active' : ''}`}
                    onClick={() => setSelectedFilter('media')}
                  >
                    Media
                  </button>
                </div>
              </div>
            </div>

            {/* FOLDER BREADCRUMB NAVIGATION (INSIDE FOLDER VIEW) */}
            {currentFolder && (
              <div className="vd-folder-breadcrumb-bar">
                <div className="vd-breadcrumb-left">
                  <button 
                    type="button" 
                    className="vd-breadcrumb-back-btn" 
                    onClick={() => setCurrentFolder(null)}
                    title="Back to All Vault Files"
                  >
                    <ArrowLeft size={16} />
                    <span>All Files</span>
                  </button>
                  <span className="vd-breadcrumb-sep">/</span>
                  <div className="vd-breadcrumb-current-folder">
                    <Folder size={18} color="#0284c7" />
                    <span className="vd-breadcrumb-folder-name" title={currentFolder}>{currentFolder}</span>
                  </div>
                </div>

                <div className="vd-breadcrumb-right">
                  <div className="vd-breadcrumb-stats-group">
                    <span className="vd-folder-stat-pill">
                      {currentFolderFiles.length} {currentFolderFiles.length === 1 ? 'file' : 'files'}
                    </span>
                    <span className="vd-folder-stat-pill">
                      {formatFileSize(currentFolderFiles.reduce((acc, f) => acc + (f.size || 0), 0))}
                    </span>
                  </div>
                  <button 
                    type="button" 
                    className="vd-folder-delete-action-btn"
                    onClick={(e) => handleDeleteFolder(currentFolder, currentFolderFiles, e)}
                    title="Delete Entire Folder"
                  >
                    <Icon icon="iconamoon:trash-bold" width={15} height={15} />
                    <span className="vd-folder-del-full">Delete Folder</span>
                    <span className="vd-folder-del-short">Delete</span>
                  </button>
                </div>
              </div>
            )}

            {/* FILES LIST & SKELETON LOADING */}
            {isFetchingCloudFiles && files.length === 0 ? (
              <div className="vd-skeleton-list">
                <div className="vd-skeleton-banner">
                  <div className="vd-progress-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  <span>Restoring Encrypted Vault from IPFS Cloud...</span>
                </div>
                {[1, 2, 3].map((idx) => (
                  <div key={idx} className="vd-file-card vd-skeleton-card">
                    <div className="vd-file-left">
                      <div className="vd-skeleton-shimmer vd-skeleton-icon" />
                      <div className="vd-file-details">
                        <div className="vd-skeleton-shimmer vd-skeleton-line vd-skeleton-title" />
                        <div className="vd-skeleton-shimmer vd-skeleton-line vd-skeleton-meta" />
                      </div>
                    </div>
                    <div className="vd-file-center">
                      <div className="vd-skeleton-shimmer vd-skeleton-chip" />
                      <div className="vd-skeleton-shimmer vd-skeleton-badge" />
                    </div>
                    <div className="vd-file-actions">
                      <div className="vd-skeleton-shimmer vd-skeleton-btn" />
                      <div className="vd-skeleton-shimmer vd-skeleton-btn" />
                      <div className="vd-skeleton-shimmer vd-skeleton-btn-small" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="vd-empty-state">
                <Icon 
                  icon={!isConnected ? "iconamoon:lock-bold" : "iconamoon:shield-yes-bold"} 
                  width={48} 
                  height={48} 
                  color={!isConnected ? "#0284c7" : "#94a3b8"} 
                />
                <h4>{!isConnected ? 'Encrypted Vault Locked' : 'No encrypted files in this view'}</h4>
                <p>
                  {!isConnected 
                    ? 'Connect your Web3 wallet (MetaMask / Coinbase) to unlock and decrypt your sovereign zero-knowledge files.'
                    : 'Upload any file or folder above to encrypt it with AES-256-GCM and pin to IPFS.'}
                </p>
                {!isConnected && (
                  <button 
                    type="button" 
                    className="vd-btn-connect"
                    style={{ marginTop: '8px' }}
                    onClick={openWalletModal}
                  >
                    <Wallet size={17} />
                    <span>Connect Wallet to Access Vault</span>
                  </button>
                )}
              </div>
            ) : (
              <div 
                key={currentFolder ? `folder-${currentFolder}` : `root-${selectedFilter}`} 
                className="vd-view-transition-wrap vd-folder-view-animate"
              >
                {/* 1. ROOT VIEW: TOP-LEVEL FOLDERS */}
                {!currentFolder && folderGroups.length > 0 && (selectedFilter === 'all' || selectedFilter === 'folders') && (
                  <div className="vd-folders-section">
                    <div className="vd-section-subhead">
                      <Folder size={16} color="#0284c7" />
                      <span>Folders ({folderGroups.length})</span>
                    </div>
                    <div className="vd-folder-grid">
                      {folderGroups.map((fg) => (
                        <div 
                          key={fg.name} 
                          className="vd-folder-card"
                          onClick={() => setCurrentFolder(fg.name)}
                        >
                          <div className="vd-folder-card-left">
                            <div className="vd-folder-icon-box">
                              <Folder size={24} color="#0284c7" />
                            </div>
                            <div className="vd-folder-card-info">
                              <h4 className="vd-folder-card-title" title={fg.name}>{fg.name}</h4>
                              <div className="vd-folder-card-meta">
                                <span>{fg.files.length} {fg.files.length === 1 ? 'file' : 'files'}</span>
                                <span>•</span>
                                <span>{formatFileSize(fg.totalSize)}</span>
                                <span>•</span>
                                <span className="vd-file-lock-tag">
                                  <Icon icon="iconamoon:lock-bold" width={12} height={12} /> AES-256-GCM
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="vd-folder-card-actions" onClick={(e) => e.stopPropagation()}>
                            <button 
                              type="button" 
                              className="vd-folder-open-btn"
                              onClick={() => setCurrentFolder(fg.name)}
                              title={`Open Folder "${fg.name}"`}
                            >
                              <span>Open</span>
                              <ChevronRight size={15} />
                            </button>

                            <button 
                              type="button" 
                              className="vd-action-btn vd-delete-btn"
                              onClick={(e) => handleDeleteFolder(fg.name, fg.files, e)}
                              title="Delete Folder & All Contained Files"
                            >
                              <Icon icon="iconamoon:trash-bold" width={15} height={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. ROOT VIEW: STANDALONE FILES OR FOLDER DRILLDOWN FILES */}
                {((currentFolder && currentFolderFiles.length > 0) || (!currentFolder && rootFiles.length > 0 && selectedFilter !== 'folders')) && (
                  <div className="vd-files-list-wrapper">
                    {!currentFolder && folderGroups.length > 0 && selectedFilter === 'all' && (
                      <div className="vd-section-subhead" style={{ marginTop: '24px' }}>
                        <Icon icon="iconamoon:file-document-bold" width={16} height={16} color="#0284c7" />
                        <span>Files ({rootFiles.length})</span>
                      </div>
                    )}

                    {/* BULK DELETE ACTION BAR */}
                    {isSelecting && (
                      <div className="vd-bulk-bar">
                        <div className="vd-bulk-bar-left">
                          <button
                            type="button"
                            className="vd-bulk-select-all"
                            onClick={() => {
                              const activeFiles = currentFolder ? currentFolderFiles : rootFiles;
                              if (selectedIds.size === activeFiles.length) {
                                setSelectedIds(new Set());
                              } else {
                                setSelectedIds(new Set(activeFiles.map(f => f.id)));
                              }
                            }}
                          >
                            {selectedIds.size === (currentFolder ? currentFolderFiles.length : rootFiles.length) ? 'Deselect All' : 'Select All'}
                          </button>
                          <span className="vd-bulk-count">
                            {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Tap cards to select'}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="vd-bulk-delete-btn"
                          disabled={selectedIds.size === 0}
                          onClick={handleBulkDelete}
                        >
                          <Icon icon="iconamoon:trash-bold" width={15} height={15} />
                          <span>Delete {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}</span>
                        </button>
                      </div>
                    )}

                    <div className="vd-file-list">
                      {(currentFolder ? currentFolderFiles : rootFiles).map((file) => {
                        const cleanName = currentFolder 
                          ? (file.name.startsWith(currentFolder + '/') ? file.name.slice(currentFolder.length + 1) : file.name)
                          : file.name;

                        return (
                          <div
                            key={file.id}
                            className={`vd-file-card ${isSelecting && selectedIds.has(file.id) ? 'vd-file-card-selected' : ''}`}
                            onClick={isSelecting ? () => toggleSelectId(file.id) : undefined}
                            style={isSelecting ? { cursor: 'pointer' } : undefined}
                          >
                            {isSelecting && (
                              <div className="vd-file-checkbox">
                                <div className={`vd-checkbox-circle ${selectedIds.has(file.id) ? 'checked' : ''}`}>
                                  {selectedIds.has(file.id) && (
                                    <Icon icon="iconamoon:check-bold" width={12} height={12} color="#ffffff" />
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="vd-file-left">
                              <div className="vd-file-icon-box">
                                {getFileIcon(file.mimeType)}
                              </div>

                              <div className="vd-file-details">
                                <div className="vd-file-title-row">
                                  <span className="vd-file-name" title={file.name}>
                                    {cleanName}
                                  </span>
                                </div>
                                <div className="vd-file-meta-row">
                                  <span className="vd-file-size">{formatFileSize(file.size)}</span>
                                  <span>•</span>
                                  <span className="vd-file-lock-tag">
                                    <Icon icon="iconamoon:lock-bold" width={13} height={13} /> AES-256-GCM
                                  </span>
                                  <span>•</span>
                                  <span className="vd-file-date">
                                    {new Date(file.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="vd-file-center">
                              <div className="vd-cid-chip" onClick={(e) => { e.stopPropagation(); copyToClipboard(file.ipfsCid, file.id); }}>
                                <span className="vd-cid-label">IPFS CID:</span>
                                <span className="vd-cid-val">{truncateCid(file.ipfsCid)}</span>
                                {copiedCid === file.id ? (
                                  <Icon icon="iconamoon:check-bold" width={14} height={14} color="#16a34a" />
                                ) : (
                                  <Icon icon="iconamoon:copy-bold" width={14} height={14} />
                                )}
                              </div>
                            </div>

                            {!isSelecting && (
                              <div className="vd-file-actions">
                                <button 
                                  type="button" 
                                  className="vd-action-btn vd-preview-btn" 
                                  onClick={() => handlePreview(file)}
                                  title="Decrypt & Preview in Browser"
                                >
                                  <Icon icon="iconamoon:eye-bold" width={15} height={15} />
                                  <span>Preview</span>
                                </button>

                                <button 
                                  type="button" 
                                  className="vd-action-btn vd-download-btn" 
                                  onClick={() => handleDecryptDownload(file)}
                                  title="Decrypt & Download Plaintext"
                                >
                                  <Icon icon="iconamoon:cloud-download-bold" width={15} height={15} />
                                  <span>Download</span>
                                </button>

                                <button 
                                  type="button" 
                                  className="vd-action-btn vd-delete-btn" 
                                  onClick={() => handleDelete(file.id)}
                                  title="Remove from Vault"
                                >
                                  <Icon icon="iconamoon:trash-bold" width={15} height={15} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 2. IN-MEMORY DECRYPTED FILE PREVIEW MODAL */}
      {previewItem && (
        <div 
          className={`vd-modal-overlay ${isPreviewClosing ? 'vd-closing' : ''}`}
          onClick={handleSmoothClosePreview}
        >
          <div className="vd-wallet-modal-card vd-preview-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="vd-modal-header">
              <div className="vd-modal-title-row">
                <Icon icon="iconamoon:shield-yes-bold" width={22} height={22} color="#0284c7" />
                <h3 className="vd-modal-title">Decrypted File Preview</h3>
              </div>
              <button 
                type="button" 
                className="vd-modal-close" 
                onClick={handleSmoothClosePreview}
              >
                <Icon icon="iconamoon:close-bold" width={20} height={20} />
              </button>
            </div>

            {/* File Meta Pill Bar */}
            <div className="vd-preview-meta-pill">
              <div className="vd-preview-meta-left">
                <Icon icon="iconamoon:file-document-bold" width={18} height={18} color="#0284c7" className="vd-preview-meta-icon" />
                <span className="vd-preview-filename" title={previewItem.file.name}>{previewItem.file.name}</span>
              </div>
              <div className="vd-preview-meta-right">
                <span className="vd-preview-filesize">{formatFileSize(previewItem.file.size)}</span>
                <span className="vd-preview-cipher-tag">
                  {previewItem.file.isKeyWrapped ? 'AES-256-GCM Envelope' : 'AES-256-GCM'}
                </span>
              </div>
            </div>

            <div className="vd-preview-stage">

              {/* 1. NEED PERMISSION VIEW (ASK FOR PERMISSION BUTTON) */}
              {previewItem.status === 'need_permission' && (
                <div className="vd-perm-stage-box">
                  <div className="vd-perm-icon-wrapper">
                    <div className="vd-perm-icon-glow" />
                    <div className="vd-perm-icon-core">
                      <Lock size={30} color="#0284c7" />
                    </div>
                  </div>

                  <div className="vd-perm-text-group">
                    <h4 className="vd-perm-stage-title">Signature Permission Required</h4>
                    <p className="vd-perm-stage-desc">
                      This confidential file is protected with your wallet's master key envelope. Sign with your wallet to permit in-memory zero-knowledge decryption.
                    </p>
                  </div>

                  <div className="vd-perm-specs-row">
                    <span className="vd-perm-spec-tag">
                      <ShieldCheck size={14} color="#16a34a" />
                      PBKDF2 Master Key
                    </span>
                    <span className="vd-perm-spec-tag">
                      <Key size={14} color="#0284c7" />
                      120,000 Rounds
                    </span>
                    <span className="vd-perm-spec-tag">
                      <Zap size={14} color="#f59e0b" />
                      Free (0 Gas Fee)
                    </span>
                  </div>

                  <button 
                    type="button" 
                    className="vd-btn-ask-permission"
                    onClick={handleRequestPermission}
                  >
                    <Key size={18} />
                    <span>Ask for Permission</span>
                  </button>
                </div>
              )}

              {/* 2. REQUESTING PERMISSION / LIVE CHECKING VIEW */}
              {previewItem.status === 'requesting_permission' && (
                <div className="vd-perm-stage-box">
                  <div className="vd-live-check-radar-wrap">
                    <div className="vd-live-check-ring" />
                    <div className="vd-live-check-ring-outer" />
                    <div className="vd-live-check-logo">
                      <img 
                        src={safeImages.metamask} 
                        alt="MetaMask" 
                        style={{ width: '32px', height: '32px', objectFit: 'contain' }} 
                      />
                    </div>
                  </div>

                  <div className="vd-perm-text-group">
                    <h4 className="vd-perm-stage-title">Awaiting Wallet Signature...</h4>
                    <p className="vd-perm-stage-desc">
                      Please approve the free cryptographic signature request in your wallet extension popup.
                    </p>
                  </div>

                  <div className="vd-live-checking-pill">
                    <span className="vd-pulse-dot" style={{ background: '#0284c7' }} />
                    <span>Live Checking Signature Permission...</span>
                  </div>
                </div>
              )}

              {/* 3. PERMISSION SUCCESS GREEN TICK VIEW */}
              {previewItem.status === 'permission_success' && (
                <div className="vd-perm-stage-box vd-perm-success-box">
                  <div className="vd-phonepe-tick-wrapper">
                    <div className="vd-phonepe-tick-circle">
                      <svg className="vd-phonepe-tick-svg" viewBox="0 0 52 52">
                        <circle className="vd-phonepe-tick-circle-bg" cx="26" cy="26" r="24" fill="none"/>
                        <path className="vd-phonepe-tick-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                      </svg>
                    </div>
                  </div>

                  <div className="vd-perm-text-group">
                    <h4 className="vd-perm-stage-title" style={{ color: '#16a34a' }}>Permission Granted!</h4>
                    <p className="vd-perm-stage-desc">
                      Master Key derived in volatile memory. Proceeding to in-memory decryption...
                    </p>
                  </div>

                  <div className="vd-live-checking-pill" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' }}>
                    <span className="vd-pulse-dot" style={{ background: '#16a34a' }} />
                    <span>Signature Permitted • Decrypting Next</span>
                  </div>
                </div>
              )}

              {/* 4. ZERO-KNOWLEDGE DECRYPTING VIEW */}
              {previewItem.status === 'decrypting' && (
                <div className="vd-decrypt-stage">
                  <div className="vd-decrypt-radar-box">
                    <div className="vd-decrypt-glow-bg" />
                    <div className="vd-decrypt-radar-ring" />
                    <div className="vd-decrypt-radar-core">
                      <Icon icon="iconamoon:shield-bold" width={26} height={26} color="#0284c7" />
                    </div>
                  </div>

                  <div className="vd-decrypt-info-group">
                    <h4 className="vd-decrypt-stage-title">Zero-Knowledge Decryption</h4>
                    <p className="vd-decrypt-stage-sub">
                      Streaming AES-256 cipher from IPFS & deciphering in volatile RAM...
                    </p>
                  </div>

                  <div className="vd-decrypt-tags-row">
                    <span className="vd-decrypt-status-pill">
                      <span className="vd-pulse-dot" style={{ background: '#0284c7' }} />
                      IPFS Stream
                    </span>
                    <span className="vd-decrypt-status-pill">
                      <span className="vd-pulse-dot" style={{ background: '#7c3aed' }} />
                      AES-GCM Key
                    </span>
                    <span className="vd-decrypt-status-pill">
                      <span className="vd-pulse-dot" style={{ background: '#16a34a' }} />
                      SHA-256 Checksum
                    </span>
                  </div>
                </div>
              )}

              {/* 5. READY / DECRYPTED MEDIA VIEW */}
              {previewItem.status === 'ready' && (
                <>
                  {previewItem.file.mimeType.startsWith('image/') ? (
                    <div className="vd-preview-image-wrap">
                      <img src={previewItem.previewUrl} alt={previewItem.file.name} />
                    </div>
                  ) : previewItem.file.mimeType.startsWith('video/') ? (
                    <video controls src={previewItem.previewUrl} className="vd-preview-video" autoPlay />
                  ) : previewItem.file.mimeType.startsWith('audio/') ? (
                    <audio controls src={previewItem.previewUrl} className="vd-preview-audio" autoPlay />
                  ) : (
                    <div className="vd-preview-unsupported">
                      <Icon icon="iconamoon:file-document-bold" width={48} height={48} color="#0284c7" />
                      <p>Encrypted document decrypted cleanly in memory buffer.</p>
                    </div>
                  )}
                </>
              )}

              {/* 6. ERROR VIEW */}
              {previewItem.status === 'error' && (
                <div className="vd-perm-stage-box">
                  <div className="vd-connect-error-icon" style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon icon="iconamoon:close-circle-bold" width={40} height={40} color="#ef4444" />
                  </div>
                  <div className="vd-perm-text-group">
                    <h4 className="vd-perm-stage-title" style={{ color: '#dc2626' }}>Decryption Authorization Failed</h4>
                    <p className="vd-perm-stage-desc">
                      {previewItem.errorMsg || 'The permission request was cancelled or timed out.'}
                    </p>
                  </div>
                  <button 
                    type="button" 
                    className="vd-btn-ask-permission"
                    style={{ marginTop: '10px' }}
                    onClick={handleRequestPermission}
                  >
                    <RefreshCw size={17} />
                    <span>Try Again</span>
                  </button>
                </div>
              )}

            </div>

            <div className="vd-preview-footer-card">
              <div className="vd-preview-checksum-col">
                <span className="vd-preview-hash-label">Verified SHA-256 Checksum</span>
                <span className="vd-preview-hash-val" title={previewItem.file.sha256Hash}>
                  {previewItem.file.sha256Hash.slice(0, 14)}...{previewItem.file.sha256Hash.slice(-10)}
                </span>
              </div>

              <button 
                type="button" 
                className="vd-btn-save-device" 
                disabled={previewItem.status !== 'ready'}
                onClick={() => handleDecryptDownload(previewItem.file)}
              >
                {previewItem.status === 'decrypting' ? (
                  <>
                    <div className="vd-spinner-white" />
                    <span>Decrypting...</span>
                  </>
                ) : (
                  <>
                    <Icon icon="iconamoon:cloud-download-bold" width={17} height={17} color="#ffffff" />
                    <span>Save to Device</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. CONNECT WALLET MODAL */}
      {isWalletModalOpen && (
        <div 
          className={`vd-modal-overlay ${isWalletClosing ? 'vd-closing' : ''}`} 
          onClick={handleSmoothCloseWallet}
        >
          <div className="vd-wallet-modal-card" onClick={(e) => e.stopPropagation()}>
            {connectStep === 'idle' && (
              <>
                <div className="vd-modal-header">
                  <div className="vd-modal-title-row">
                    <Wallet size={20} color="#0284c7" />
                    <h3 className="vd-modal-title">Connect Web3 Wallet</h3>
                  </div>
                  <button type="button" className="vd-modal-close" onClick={handleSmoothCloseWallet}>
                    <Icon icon="iconamoon:close-bold" width={20} height={20} />
                  </button>
                </div>

                <p className="vd-wallet-modal-subtitle">
                  Connect to Base Sepolia testnet to anchor your encrypted file proofs and cryptographic hashes on-chain.
                </p>

                <div className="vd-wallet-options-list">
                  {/* Option 1: MetaMask (Recommended) */}
                  <button 
                    type="button" 
                    className="vd-wallet-option-btn vd-wallet-recommended-option"
                    onClick={() => handleInitiateConnect(
                      'MetaMask', 
                      safeImages.metamask, 
                      hasInjectedWallet, 
                      'https://metamask.io/download/'
                    )}
                  >
                    <div className="vd-wallet-option-left">
                      <div className="vd-wallet-logo-box" style={{ background: '#ffffff', padding: '4px', border: '1px solid rgba(0,0,0,0.06)' }}>
                        <img 
                          src={safeImages.metamask} 
                          alt="MetaMask" 
                          style={{ width: '28px', height: '28px', objectFit: 'contain' }} 
                        />
                      </div>
                      <div className="vd-wallet-option-meta">
                        <div className="vd-wallet-title-row">
                          <span className="vd-wallet-name">MetaMask</span>
                          <span className="vd-wallet-recommended-badge">Recommended</span>
                        </div>
                        <span className="vd-wallet-status">
                          {hasInjectedWallet 
                            ? 'Detected Browser Wallet' 
                            : ((typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')) 
                              ? 'Open in MetaMask App' 
                              : 'Install MetaMask Extension')}
                        </span>
                      </div>
                    </div>
                    <Icon icon="iconamoon:arrow-right-2-bold" width={18} height={18} />
                  </button>

                  {/* Option 2: Coinbase Wallet */}
                  <button 
                    type="button" 
                    className="vd-wallet-option-btn"
                    onClick={() => handleInitiateConnect(
                      'Coinbase Wallet', 
                      safeImages.coinbase, 
                      hasInjectedWallet, 
                      'https://www.coinbase.com/wallet/downloads'
                    )}
                  >
                    <div className="vd-wallet-option-left">
                      <div className="vd-wallet-logo-box" style={{ background: '#ffffff', padding: '4px', border: '1px solid rgba(0,0,0,0.06)' }}>
                        <img 
                          src={safeImages.coinbase} 
                          alt="Coinbase Wallet" 
                          style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '6px' }} 
                        />
                      </div>
                      <div className="vd-wallet-option-meta">
                        <div className="vd-wallet-title-row">
                          <span className="vd-wallet-name">Coinbase Wallet</span>
                        </div>
                        <span className="vd-wallet-status">
                          {hasInjectedWallet 
                            ? 'Detected Browser Wallet' 
                            : ((typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')) 
                              ? 'Open in Coinbase App' 
                              : 'Smart Wallet & Injected')}
                        </span>
                      </div>
                    </div>
                    <Icon icon="iconamoon:arrow-right-2-bold" width={18} height={18} />
                  </button>

                  {/* Option 3: Trust Wallet */}
                  <button 
                    type="button" 
                    className="vd-wallet-option-btn"
                    onClick={() => handleInitiateConnect(
                      'Trust Wallet', 
                      '', 
                      hasInjectedWallet, 
                      'https://trustwallet.com/download'
                    )}
                  >
                    <div className="vd-wallet-option-left">
                      <div className="vd-wallet-logo-box" style={{ background: '#ffffff', padding: '4px', border: '1px solid rgba(0,0,0,0.06)' }}>
                        <TrustWalletIcon size={28} />
                      </div>
                      <div className="vd-wallet-option-meta">
                        <div className="vd-wallet-title-row">
                          <span className="vd-wallet-name">Trust Wallet</span>
                        </div>
                        <span className="vd-wallet-status">
                          {hasInjectedWallet 
                            ? 'Detected Browser Wallet' 
                            : ((typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')) 
                              ? 'Open in Trust Wallet App' 
                              : 'Mobile App & Web Extension')}
                        </span>
                      </div>
                    </div>
                    <Icon icon="iconamoon:arrow-right-2-bold" width={18} height={18} />
                  </button>
                </div>
              </>
            )}

            {/* WAITING FOR WALLET SIGNATURE / APPROVAL ANIMATION */}
            {connectStep === 'waiting' && (
              <div className="vd-connect-anim-box">
                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>
                  <button type="button" className="vd-modal-close" onClick={handleSmoothCloseWallet}>
                    <Icon icon="iconamoon:close-bold" width={18} height={18} />
                  </button>
                </div>
                <div className="vd-connect-spinner-wrap">
                  <div className="vd-connect-spinner-ring" />
                  <div className="vd-connect-logo-center">
                    {selectedWalletLogo ? (
                      <img src={selectedWalletLogo} alt={selectedWalletName} />
                    ) : selectedWalletName.includes('Trust') ? (
                      <TrustWalletIcon size={36} />
                    ) : (
                      <Wallet size={32} color="#0284c7" />
                    )}
                  </div>
                </div>
                <h3 className="vd-connect-status-title">Waiting for Approval...</h3>
                <p className="vd-connect-status-desc">
                  Please accept the connection request in your <strong>{selectedWalletName}</strong> popup window.
                </p>
                <div className="vd-connect-step-indicator">
                  <span className="vd-pulse-dot" />
                  <span>Connecting to Base Sepolia Testnet</span>
                </div>
              </div>
            )}

            {/* PHONEPE-STYLE SUCCESS ANIMATION (ANIMATED GREEN CIRCLE + DRAW TICK) */}
            {connectStep === 'success' && (
              <div className="vd-connect-anim-box vd-connect-success-box">
                <div className="vd-phonepe-tick-wrapper">
                  <div className="vd-phonepe-tick-circle">
                    <svg className="vd-phonepe-tick-svg" viewBox="0 0 52 52">
                      <circle className="vd-phonepe-tick-circle-bg" cx="26" cy="26" r="24" fill="none"/>
                      <path className="vd-phonepe-tick-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                  </div>
                </div>
                <h3 className="vd-connect-success-title">Connected Successfully!</h3>
                <p className="vd-connect-success-desc">
                  Zero-Knowledge cryptographic session linked to Base Sepolia.
                </p>
              </div>
            )}

            {/* ERROR / REJECTED VIEW */}
            {connectStep === 'error' && (
              <div className="vd-connect-anim-box">
                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>
                  <button type="button" className="vd-modal-close" onClick={handleSmoothCloseWallet}>
                    <Icon icon="iconamoon:close-bold" width={18} height={18} />
                  </button>
                </div>
                <div className="vd-connect-error-icon">
                  <Icon icon="iconamoon:close-circle-bold" width={56} height={56} color="#ef4444" />
                </div>
                <h3 className="vd-connect-status-title" style={{ color: '#dc2626' }}>Connection Cancelled</h3>
                <p className="vd-connect-status-desc">
                  {connectErrorMsg || 'The connection request was rejected or timed out.'}
                </p>
                <button 
                  type="button" 
                  className="vd-btn-connect"
                  style={{ marginTop: '16px' }}
                  onClick={() => setConnectStep('idle')}
                >
                  <span>Try Again</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. CONNECTED WALLET ACCOUNT & SESSION DETAILS MODAL */}
      {isAccountModalOpen && (
        <div 
          className={`vd-modal-overlay ${isAccountClosing ? 'vd-closing' : ''}`} 
          onClick={handleSmoothCloseAccount}
        >
          <div className="vd-wallet-modal-card vd-account-modal-card" onClick={(e) => e.stopPropagation()}>
            {disconnectStep === 'idle' && (
              <>
                <div className="vd-modal-header">
                  <div className="vd-modal-title-row">
                    <Wallet size={20} color="#0284c7" />
                    <h3 className="vd-modal-title">Wallet & Session Details</h3>
                  </div>
                  <button type="button" className="vd-modal-close" onClick={handleSmoothCloseAccount}>
                    <Icon icon="iconamoon:close-bold" width={20} height={20} />
                  </button>
                </div>

                {/* Address Banner Card */}
                <div className="vd-account-address-card">
                  <div className="vd-account-avatar-ring">
                    <img 
                      src={safeImages.mascotCharacter} 
                      alt="Wallet Identicon" 
                      className="vd-account-avatar-img"
                    />
                    <span className="vd-account-online-dot" />
                  </div>
                  <div className="vd-account-info-col">
                    <div className="vd-account-label-row">
                      <span className="vd-account-label">Connected Wallet</span>
                      <span className="vd-account-active-tag">Active</span>
                    </div>
                    <span className="vd-account-full-addr" title={address || ''}>
                      {address ? `${address.slice(0, 12)}...${address.slice(-10)}` : '0x0000...0000'}
                    </span>
                  </div>
                </div>

                {/* Action Bar (Copy & Explorer) */}
                <div className="vd-account-actions-row">
                  <button 
                    type="button" 
                    className="vd-account-action-pill"
                    onClick={handleCopyAddress}
                  >
                    <Icon icon={copiedAddress ? "iconamoon:check-bold" : "iconamoon:copy-bold"} width={15} height={15} />
                    <span>{copiedAddress ? 'Copied!' : 'Copy Address'}</span>
                  </button>

                  <a 
                    href={`https://sepolia.basescan.org/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vd-account-action-pill"
                  >
                    <Icon icon="iconamoon:external-link-bold" width={15} height={15} />
                    <span>View on BaseScan</span>
                  </a>
                </div>

                {/* Session Stats Grid */}
                <div className="vd-account-stats-grid">
                  <div className="vd-account-stat-box">
                    <span className="vd-stat-box-title">Network</span>
                    <div className="vd-stat-box-val">
                      <BaseLogoIcon size={15} />
                      <span>Base Sepolia</span>
                    </div>
                  </div>

                  <div className="vd-account-stat-box">
                    <span className="vd-stat-box-title">Balance</span>
                    <div className="vd-stat-box-val">
                      <span className="vd-stat-eth-symbol">Ξ</span>
                      <span>{balance} ETH</span>
                    </div>
                  </div>
                </div>



                {/* Disconnect & Logout Button */}
                <div className="vd-account-logout-wrapper">
                  <button 
                    type="button" 
                    className="vd-btn-logout-wallet"
                    onClick={handleInitiateDisconnect}
                  >
                    <Icon icon="iconamoon:exit-bold" width={17} height={17} color="#ffffff" />
                    <span>Disconnect & Log Out</span>
                  </button>
                </div>
              </>
            )}

            {/* DISCONNECTING ANIMATION */}
            {disconnectStep === 'disconnecting' && (
              <div className="vd-connect-anim-box">
                <div className="vd-disconnect-spinner-wrap">
                  <div className="vd-disconnect-spinner-ring" />
                  <div className="vd-disconnect-logo-center">
                    <Icon icon="iconamoon:exit-bold" width={28} height={28} color="#e11d48" />
                  </div>
                </div>
                <h3 className="vd-connect-status-title">Disconnecting Session...</h3>
                <p className="vd-connect-status-desc">
                  Revoking cryptographic permissions and unlinking sovereign keys.
                </p>
                <div className="vd-disconnect-step-indicator">
                  <span className="vd-disconnect-pulse-dot" />
                  <span>Terminating Web3 Session</span>
                </div>
              </div>
            )}

            {/* PHONEPE-STYLE DISCONNECT SUCCESS ANIMATION */}
            {disconnectStep === 'success' && (
              <div className="vd-connect-anim-box vd-connect-success-box">
                <div className="vd-phonepe-tick-wrapper">
                  <div className="vd-phonepe-tick-circle">
                    <svg className="vd-phonepe-tick-svg" viewBox="0 0 52 52">
                      <circle className="vd-phonepe-tick-circle-bg" cx="26" cy="26" r="24" fill="none"/>
                      <path className="vd-phonepe-tick-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                  </div>
                </div>
                <h3 className="vd-connect-success-title">Disconnected Successfully!</h3>
                <p className="vd-connect-success-desc">
                  Your wallet and session have been safely signed out.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
