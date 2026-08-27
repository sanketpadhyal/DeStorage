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
import { Wallet } from 'lucide-react';

interface VaultDashboardProps {
  onBackToHome: () => void;
}

const BaseLogoIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 115 115" fill="none">
    <circle cx="57.5" cy="57.5" r="57.5" fill="#0052FF"/>
    <path d="M57.26 89.17c17.5 0 31.68-14.18 31.68-31.67 0-17.5-14.18-31.68-31.68-31.68-14.73 0-27.14 10.05-30.73 23.69h38.31c2.19 0 3.97 1.78 3.97 3.97v8.04c0 2.19-1.78 3.97-3.97 3.97H26.53c3.59 13.64 16 23.68 30.73 23.68z" fill="#fff"/>
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
    switchToBaseSepolia 
  } = useWeb3();

  const [files, setFiles] = useState<VaultFileItem[]>(() => {
    const saved = localStorage.getItem('destorage_vault_files');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStage, setUploadStage] = useState<string>('');
  const [customPassphrase, setCustomPassphrase] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [copiedCid, setCopiedCid] = useState<string | null>(null);

  // Preview Modal State
  const [previewItem, setPreviewItem] = useState<{
    file: VaultFileItem;
    previewUrl: string;
    isDecrypting: boolean;
  } | null>(null);

  const [isWalletClosing, setIsWalletClosing] = useState<boolean>(false);
  const [isPreviewClosing, setIsPreviewClosing] = useState<boolean>(false);

  const handleSmoothCloseWallet = () => {
    setIsWalletClosing(true);
    setTimeout(() => {
      setIsWalletClosing(false);
      closeWalletModal();
    }, 220);
  };

  const handleSmoothClosePreview = () => {
    setIsPreviewClosing(true);
    setTimeout(() => {
      setIsPreviewClosing(false);
      setPreviewItem(null);
    }, 220);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist files metadata to localStorage
  useEffect(() => {
    const metadataOnly = files.map(f => ({
      ...f,
      encryptedBuffer: undefined, // exclude buffer from JSON storage
    }));
    localStorage.setItem('destorage_vault_files', JSON.stringify(metadataOnly));
  }, [files]);

  // Update browser URL query params dynamically based on wallet state
  useEffect(() => {
    if (isConnected && address) {
      window.history.replaceState(
        { view: 'vault', auth: address },
        'DeStorage Vault | Zero-Knowledge Session',
        `/vault?network=base-sepolia&auth=${address.slice(0, 6)}...${address.slice(-4)}&cipher=aes-256-gcm&protocol=ipfs`
      );
    } else {
      window.history.replaceState(
        { view: 'vault' },
        'DeStorage Vault | Decentralized Encrypted Storage',
        '/vault?network=base-sepolia&cipher=aes-256-gcm&protocol=ipfs'
      );
    }
  }, [isConnected, address]);

  // Handle Drag & Drop Upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    let selectedFiles: FileList | null = null;
    if ('dataTransfer' in e) {
      e.preventDefault();
      selectedFiles = e.dataTransfer.files;
    } else if (e.target.files) {
      selectedFiles = e.target.files;
    }

    if (!selectedFiles || selectedFiles.length === 0) return;

    const fileToUpload = selectedFiles[0];
    await processFileUpload(fileToUpload);
  };

  const processFileUpload = async (file: File) => {
    try {
      setIsUploading(true);

      // Step 1: Encrypt File locally in browser
      const encryptedData: EncryptedFilePayload = await encryptFile(
        file,
        customPassphrase,
        (stage) => setUploadStage(stage)
      );

      // Step 2: Upload to decentralized IPFS
      setUploadStage('Pinning encrypted payload to decentralized IPFS...');
      const ipfsResult: IpfsUploadResult = await uploadToIpfs(
        encryptedData.encryptedBuffer,
        file.name
      );

      // Step 3: Register in Vault
      setUploadStage('Registering cryptographic proof on Base Sepolia...');
      const newVaultItem: VaultFileItem = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        ipfsCid: ipfsResult.cid,
        sha256Hash: encryptedData.sha256Hash,
        keyHex: encryptedData.keyHex,
        ivHex: encryptedData.ivHex,
        timestamp: Date.now(),
        encryptedBuffer: encryptedData.encryptedBuffer,
      };

      setFiles(prev => [newVaultItem, ...prev]);
      setCustomPassphrase('');
      setUploadStage('Upload & Encryption Complete!');
      setTimeout(() => {
        setIsUploading(false);
        setUploadStage('');
      }, 1000);
    } catch (err: any) {
      console.error('File encryption & upload failed:', err);
      alert(`Encryption error: ${err.message || 'Failed to process file'}`);
      setIsUploading(false);
      setUploadStage('');
    }
  };

  // Decrypt and Download file
  const handleDecryptDownload = async (item: VaultFileItem) => {
    try {
      let buffer = item.encryptedBuffer;
      if (!buffer) {
        const { fetchFromIpfs } = await import('../ipfs/ipfsService');
        buffer = await fetchFromIpfs(item.ipfsCid);
      }

      const { decryptedBlob } = await decryptFile(
        buffer,
        item.keyHex,
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
      setPreviewItem({ file: item, previewUrl: '', isDecrypting: true });

      let buffer = item.encryptedBuffer;
      if (!buffer) {
        const { fetchFromIpfs } = await import('../ipfs/ipfsService');
        buffer = await fetchFromIpfs(item.ipfsCid);
      }

      const { objectUrl } = await decryptFile(
        buffer,
        item.keyHex,
        item.ivHex,
        item.mimeType
      );

      setPreviewItem({ file: item, previewUrl: objectUrl, isDecrypting: false });
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

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to remove this file from your vault?')) {
      setFiles(prev => prev.filter(f => f.id !== id));
    }
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
              <div className="vd-wallet-connected">
                <div className="vd-wallet-badge">
                  {!isBaseSepolia && (
                    <button 
                      type="button" 
                      className="vd-switch-net-btn" 
                      onClick={switchToBaseSepolia}
                    >
                      Switch to Base
                    </button>
                  )}
                  <span className="vd-address">
                    {`${address.slice(0, 6)}...${address.slice(-4)}`}
                  </span>
                  <span className="vd-balance">
                    {balance} ETH
                  </span>
                </div>

                <button 
                  type="button" 
                  className="vd-disconnect-btn" 
                  onClick={disconnectWallet}
                >
                  Disconnect
                </button>
              </div>
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

            <div className="vd-stat-card vd-card-purple">
              <div className="vd-stat-icon vd-icon-purple">
                <Icon icon="iconamoon:lock-bold" width={22} height={22} />
              </div>
              <div className="vd-stat-info">
                <span className="vd-stat-label">Encryption Standard</span>
                <span className="vd-stat-value">AES-256-GCM</span>
              </div>
            </div>

            <div className="vd-stat-card vd-card-amber">
              <div className="vd-stat-icon vd-icon-amber">
                <Icon icon="iconamoon:cloud-bold" width={22} height={22} />
              </div>
              <div className="vd-stat-info">
                <span className="vd-stat-label">Storage Protocol</span>
                <span className="vd-stat-value">IPFS + Base EVM</span>
              </div>
            </div>
          </div>

          {/* UPLOAD & ENCRYPT DROPZONE */}
          <div 
            className="vd-upload-card"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileSelect}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileSelect} 
            />

            <div className="vd-upload-inner">
              <div className="vd-upload-icon-box">
                <Icon icon="iconamoon:cloud-upload-bold" width={40} height={40} color="#0284c7" />
              </div>

              <div className="vd-upload-texts">
                <h3 className="vd-upload-title">Drag & drop files to encrypt and store</h3>
                <p className="vd-upload-desc">
                  Browser-native AES-256-GCM encryption runs locally before upload. Plaintext never leaves your machine.
                </p>
              </div>

              <div className="vd-passphrase-row">
                <div className="vd-passphrase-input-wrap">
                  <Icon icon="iconamoon:shield-bold" width={17} height={17} color="#64748b" />
                  <input 
                    type="password" 
                    placeholder="Optional Custom Encryption Passphrase (PBKDF2)" 
                    value={customPassphrase}
                    onChange={(e) => setCustomPassphrase(e.target.value)}
                    className="vd-passphrase-input"
                  />
                </div>

                <button 
                  type="button" 
                  className="vd-btn-select-file" 
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon icon="iconamoon:shield-yes-bold" width={18} height={18} />
                  <span>{isUploading ? 'Encrypting...' : 'Select File to Encrypt'}</span>
                </button>
              </div>

              {/* Progress feedback bar */}
              {isUploading && (
                <div className="vd-progress-box">
                  <div className="vd-progress-spinner"></div>
                  <span className="vd-progress-text">{uploadStage}</span>
                </div>
              )}
            </div>
          </div>

          {/* VAULT FILE EXPLORER */}
          <div className="vd-files-section">
            <div className="vd-files-header">
              <div className="vd-files-title-row">
                <h3 className="vd-section-title">Encrypted Vault Storage</h3>
                <span className="vd-files-count">{filteredFiles.length} files</span>
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

            {/* FILES LIST */}
            {filteredFiles.length === 0 ? (
              <div className="vd-empty-state">
                <Icon icon="iconamoon:shield-yes-bold" width={48} height={48} color="#94a3b8" />
                <h4>No encrypted files in this view</h4>
                <p>Upload any file above to encrypt it with AES-256-GCM and pin to IPFS.</p>
              </div>
            ) : (
              <div className="vd-file-list">
                {filteredFiles.map((file) => (
                  <div key={file.id} className="vd-file-card">
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
                      <div className="vd-cid-chip" onClick={() => copyToClipboard(file.ipfsCid, file.id)}>
                        <span className="vd-cid-label">IPFS CID:</span>
                        <span className="vd-cid-val">{truncateCid(file.ipfsCid)}</span>
                        {copiedCid === file.id ? (
                          <Icon icon="iconamoon:check-bold" width={14} height={14} color="#16a34a" />
                        ) : (
                          <Icon icon="iconamoon:copy-bold" width={14} height={14} />
                        )}
                      </div>

                      <span className="vd-verified-badge" title={file.sha256Hash}>
                        <Icon icon="iconamoon:check-bold" width={13} height={13} /> Base EVM Verified
                      </span>
                    </div>

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
                  </div>
                ))}
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
          <div className="vd-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="vd-modal-header">
              <div className="vd-modal-title-wrap">
                <Icon icon="iconamoon:shield-yes-bold" width={22} height={22} color="#0284c7" />
                <h3>Decrypted File Preview</h3>
              </div>
              <button 
                type="button" 
                className="vd-modal-close" 
                onClick={handleSmoothClosePreview}
              >
                <Icon icon="iconamoon:close-bold" width={20} height={20} />
              </button>
            </div>

            <div className="vd-preview-body">
              {previewItem.isDecrypting ? (
                <div className="vd-decrypting-state">
                  <div className="vd-progress-spinner" />
                  <p>Deriving PBKDF2 Key & Decrypting AES-GCM Buffer in Memory...</p>
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
                  <button 
                    type="button" 
                    className="vd-btn-select-file"
                    onClick={() => handleDecryptDownload(previewItem.file)}
                  >
                    <Icon icon="iconamoon:cloud-download-bold" width={16} height={16} />
                    <span>Download Decrypted File</span>
                  </button>
                </div>
              )}
            </div>

            <div className="vd-preview-footer">
              <div className="vd-preview-hash-box">
                <span className="vd-preview-hash-label">Verified SHA-256 Checksum:</span>
                <span className="vd-preview-hash-val">{previewItem.file.sha256Hash}</span>
              </div>

              <button 
                type="button" 
                className="vd-btn-select-file" 
                onClick={() => handleDecryptDownload(previewItem.file)}
              >
                <Icon icon="iconamoon:cloud-download-bold" width={16} height={16} />
                <span>Save to Device</span>
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
              {/* Option 1: MetaMask */}
              <button 
                type="button" 
                className="vd-wallet-option-btn"
                onClick={() => {
                  if (hasInjectedWallet) {
                    connectWallet();
                  } else {
                    window.open('https://metamask.io/download/', '_blank');
                  }
                }}
              >
                <div className="vd-wallet-option-left">
                  <div className="vd-wallet-logo-box" style={{ background: '#fff7ed', color: '#ea580c' }}>
                    🦊
                  </div>
                  <div className="vd-wallet-option-meta">
                    <span className="vd-wallet-name">MetaMask</span>
                    <span className="vd-wallet-status">
                      {hasInjectedWallet ? 'Detected Browser Extension' : 'Install MetaMask Extension'}
                    </span>
                  </div>
                </div>
                <Icon icon="iconamoon:arrow-right-2-bold" width={18} height={18} />
              </button>

              {/* Option 2: Coinbase Wallet */}
              <button 
                type="button" 
                className="vd-wallet-option-btn"
                onClick={() => {
                  if (hasInjectedWallet) {
                    connectWallet();
                  } else {
                    window.open('https://www.coinbase.com/wallet/downloads', '_blank');
                  }
                }}
              >
                <div className="vd-wallet-option-left">
                  <div className="vd-wallet-logo-box" style={{ background: '#eff6ff', color: '#0052ff' }}>
                    🔵
                  </div>
                  <div className="vd-wallet-option-meta">
                    <span className="vd-wallet-name">Coinbase Wallet</span>
                    <span className="vd-wallet-status">Smart Wallet & Injected</span>
                  </div>
                </div>
                <Icon icon="iconamoon:arrow-right-2-bold" width={18} height={18} />
              </button>

              {/* Option 3: Instant Demo Session */}
              <button 
                type="button" 
                className="vd-wallet-option-btn vd-wallet-demo-option"
                onClick={connectDemoWallet}
              >
                <div className="vd-wallet-option-left">
                  <div className="vd-wallet-logo-box" style={{ background: '#eff6ff', color: '#0284c7' }}>
                    ⚡
                  </div>
                  <div className="vd-wallet-option-meta">
                    <span className="vd-wallet-name">Instant Demo Wallet</span>
                    <span className="vd-wallet-status">No extension needed • 0.4500 ETH Base Testnet</span>
                  </div>
                </div>
                <span className="vd-wallet-pill-quick">1-Click Test</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
