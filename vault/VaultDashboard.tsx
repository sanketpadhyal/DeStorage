import React, { useState, useEffect, useRef } from 'react';
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
import { Wallet, Zap } from 'lucide-react';

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

  // Preview Modal State
  const [previewItem, setPreviewItem] = useState<{
    file: VaultFileItem;
    previewUrl: string;
    isDecrypting: boolean;
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
      if (walletName.toLowerCase().includes('metamask')) {
        // Direct deep-link into MetaMask app's built-in Web3 browser
        const currentPath = `${window.location.host}${window.location.pathname}${window.location.search}`;
        window.location.href = `https://metamask.app.link/dapp/${currentPath}`;
        return;
      }
      if (walletName.toLowerCase().includes('coinbase')) {
        // Direct deep-link into Coinbase Wallet app
        const fullUrl = encodeURIComponent(window.location.href);
        window.location.href = `https://go.cb-w.com/dapp?cb_url=${fullUrl}`;
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
          }
        } catch (e) {}
      }

      // Show skeleton loading if we don't have local cache
      if (!hasLocal) {
        setIsFetchingCloudFiles(true);
      }

      // Automatically query Pinata IPFS Cloud to restore files across cache clears and new devices
      import('../ipfs/ipfsService').then(({ fetchWalletFilesFromPinata }) => {
        fetchWalletFilesFromPinata(address, undefined, masterKey).then((cloudFiles) => {
          if (cloudFiles && cloudFiles.length > 0) {
            setFiles(prev => {
              const existingCids = new Set(prev.map(f => f.ipfsCid));
              const newFiles = cloudFiles.filter(f => !existingCids.has(f.ipfsCid));
              if (newFiles.length > 0) {
                const merged = [...newFiles, ...prev];
                localStorage.setItem(walletKey, JSON.stringify(merged));
                return merged;
              }
              return prev;
            });
          }
        }).catch(() => {}).finally(() => {
          setIsFetchingCloudFiles(false);
        });
      });
    } else {
      // Wallet disconnected: clear active files for Zero-Knowledge privacy
      setFiles([]);
      setIsFetchingCloudFiles(false);
    }
  }, [isConnected, address, masterKey]);

  // Persist files strictly scoped to active wallet & background sync
  useEffect(() => {
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
    } else if (previewItem?.isDecrypting) {
      document.title = `Decrypting ${previewItem.file.name}... | DeStorage`;
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

  // Handle Drag & Drop Upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    if (!isConnected || !address) {
      openWalletModal();
      return;
    }
    let selectedFiles: FileList | null = null;
    if ('dataTransfer' in e) {
      e.preventDefault();
      selectedFiles = e.dataTransfer.files;
    } else if (e.target.files) {
      selectedFiles = e.target.files;
    }

    if (!selectedFiles || selectedFiles.length === 0) return;

    const allFiles = Array.from(selectedFiles);

    // Batch up to 10 files of any type
    if (allFiles.length > 10) {
      alert(`Only the first 10 files will be uploaded (${allFiles.length} selected).`);
    }
    const batch = allFiles.slice(0, 10);

    if (batch.length === 1) {
      // Single file — use normal flow
      await processFileUpload(batch[0]);
      return;
    }

    // Multi-file batch
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

  const processFileUpload = async (file: File, isBatch = false) => {
    if (!isConnected || !address) {
      openWalletModal();
      return;
    }
    try {
      if (!isBatch) setIsUploading(true);

      // Step 1: Encrypt File locally in browser memory
      const encryptedData: EncryptedFilePayload = await encryptFile(
        file,
        customPassphrase,
        (stage) => setUploadStage(isBatch ? `${file.name}: ${stage}` : stage)
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
      // Notice: if wrappedInfo exists, we send wrappedKeyHex and wrapIvHex to Pinata, NEVER raw key!
      setUploadStage(isBatch ? `${file.name}: Pinning to IPFS...` : 'Pinning to IPFS...');
      setUploadedBytes(0);
      setTotalBytes(encryptedData.encryptedBuffer.byteLength);
      setUploadSpeed('');
      setUploadEta('');
      const uploadStartTime = Date.now();
      const ipfsResult: IpfsUploadResult = await uploadToIpfs(
        encryptedData.encryptedBuffer,
        file.name,
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
        name: file.name,
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
      a.download = item.name;
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
    try {
      let rawKeyHex = item.keyHex;

      // If key is wrapped, unwrap with masterKey
      if (item.isKeyWrapped && item.wrappedKeyHex && item.wrapIvHex) {
        let activeMasterKey = masterKey;
        if (!activeMasterKey && address) {
          activeMasterKey = await unlockMasterKey(address);
        }
        if (activeMasterKey) {
          const { unwrapKeyWithMasterKey } = await import('../crypto/encryptionEngine');
          try {
            rawKeyHex = await unwrapKeyWithMasterKey(item.wrappedKeyHex, item.wrapIvHex, activeMasterKey);
            setFiles(prev => prev.map(f => f.id === item.id ? { ...f, keyHex: rawKeyHex, isKeyWrapped: false } : f));
          } catch (e) {
            console.warn('Could not unwrap key:', e);
          }
        }
      }

      setPreviewItem({ file: { ...item, keyHex: rawKeyHex }, previewUrl: '', isDecrypting: true });

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

      setPreviewItem({ file: { ...item, keyHex: rawKeyHex }, previewUrl: objectUrl, isDecrypting: false });
    } catch (err: any) {
      alert(`Decryption preview failed: ${err.message || 'Could not decrypt file'}`);
      setPreviewItem(null);
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
        const delCids = JSON.parse(localStorage.getItem(delKey) || '[]');
        for (const f of toDelete) {
          if (!delCids.includes(f.ipfsCid)) delCids.push(f.ipfsCid);
        }
        localStorage.setItem(delKey, JSON.stringify(delCids));
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

  // Filter files
  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.ipfsCid.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedFilter === 'photos') return f.mimeType.startsWith('image/');
    if (selectedFilter === 'docs') return f.mimeType.includes('pdf') || f.mimeType.includes('text') || f.mimeType.includes('document');
    if (selectedFilter === 'media') return f.mimeType.startsWith('video/') || f.mimeType.startsWith('audio/');
    return true;
  });

  const totalStorageBytes = files.reduce((acc, curr) => acc + curr.size, 0);

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
                <Icon icon="iconamoon:shield-yes-bold" width={22} height={22} />
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
                  <h3 className="vd-upload-title">Drag & drop to encrypt and store</h3>
                  <p className="vd-upload-desc">
                    Upload up to <strong>10 files at once</strong> — photos, videos, docs & more. AES-256-GCM encrypted locally before IPFS storage.
                  </p>
                </div>

                <div className="vd-passphrase-row" style={{ justifyContent: 'center' }}>
                  <button 
                    type="button" 
                    className="vd-btn-select-file" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Icon icon="iconamoon:cloud-upload-bold" width={19} height={19} />
                    <span>Select Files to Encrypt</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* VAULT FILE EXPLORER */}
          <div className="vd-files-section">
            <div className="vd-files-header">
              <div className="vd-files-title-row">
                <h3 className="vd-section-title">Encrypted Vault Storage</h3>
                <span className="vd-files-count">{filteredFiles.length} files</span>
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
                    onClick={() => setSelectedFilter('all')}
                  >
                    All
                  </button>
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
                    : 'Upload any file above to encrypt it with AES-256-GCM and pin to IPFS.'}
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
              <>
                {/* BULK DELETE ACTION BAR */}
                {isSelecting && (
                  <div className="vd-bulk-bar">
                    <div className="vd-bulk-bar-left">
                      <button
                        type="button"
                        className="vd-bulk-select-all"
                        onClick={() => {
                          if (selectedIds.size === filteredFiles.length) {
                            setSelectedIds(new Set());
                          } else {
                            setSelectedIds(new Set(filteredFiles.map(f => f.id)));
                          }
                        }}
                      >
                        {selectedIds.size === filteredFiles.length ? 'Deselect All' : 'Select All'}
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
                  {filteredFiles.map((file) => (
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
                          <span className="vd-file-name" title={file.name}>{file.name}</span>
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
                  ))}
                </div>
              </>
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
              <span className="vd-preview-filename">{previewItem.file.name}</span>
              <span className="vd-preview-filesize">{formatFileSize(previewItem.file.size)}</span>
              <span className="vd-preview-cipher-tag">AES-256-GCM</span>
            </div>

            <div className="vd-preview-stage">
              {previewItem.isDecrypting ? (
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
                      Streaming AES-256 cipher from IPFS & deciphering in local memory...
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
              ) : previewItem.file.mimeType.startsWith('image/') ? (
                <div className="vd-preview-image-wrap">
                  <img src={previewItem.previewUrl} alt={previewItem.file.name} />
                </div>
              ) : previewItem.file.mimeType.startsWith('video/') ? (
                <video controls src={previewItem.previewUrl} className="vd-preview-video" />
              ) : previewItem.file.mimeType.startsWith('audio/') ? (
                <audio controls src={previewItem.previewUrl} className="vd-preview-audio" />
              ) : (
                <div className="vd-preview-unsupported">
                  <Icon icon="iconamoon:file-document-bold" width={48} height={48} color="#0284c7" />
                  <p>Encrypted file decrypted cleanly in memory buffer.</p>
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
                disabled={previewItem.isDecrypting}
                onClick={() => handleDecryptDownload(previewItem.file)}
              >
                {previewItem.isDecrypting ? (
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
                    <img src={selectedWalletLogo} alt={selectedWalletName} />
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

                {/* Faucet helper banner */}
                <a 
                  href="https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="vd-account-faucet-link"
                >
                  <Icon icon="iconamoon:lightning-bold" width={16} height={16} color="#0284c7" />
                  <span>Need testnet gas? Get Free Base Sepolia ETH ➔</span>
                </a>

                {/* Zero-Knowledge Cross-Device Sync Card */}
                <div className="vd-account-sync-card">
                  <div className="vd-account-sync-info">
                    <div className="vd-account-sync-title-row">
                      <Icon icon="iconamoon:cloud-upload-bold" width={17} height={17} color="#0284c7" />
                      <span className="vd-account-sync-title">Cross-Device Master Sync</span>
                    </div>
                    <span className="vd-account-sync-desc">
                      Your encrypted vault is automatically synced across all devices via Pinata IPFS Cloud — no manual sync needed.
                    </span>
                  </div>
                  <span className="vd-auto-sync-badge">
                    <Icon icon="iconamoon:check-circle-1-bold" width={13} height={13} />
                    Auto
                  </span>
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
