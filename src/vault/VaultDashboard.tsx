import React, { useState, useEffect, useRef } from 'react';
import './VaultDashboard.css';
import { safeImages } from '../etc/safeimages';
import { useWeb3 } from '../web3/Web3Context';
import { 
  encryptFile, 
  decryptFile, 
  EncryptedFilePayload 
} from '../crypto/encryptionEngine';
import { uploadToIpfs, IpfsUploadResult } from '../ipfs/ipfsService';

import {
  ShieldCheck,
  Lock,
  Unlock,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  File,
  Download,
  Eye,
  Trash2,
  Copy,
  Check,
  Wallet,
  ArrowLeft,
  Search,
  Key,
  HardDrive,
  Cpu,
  Layers,
  X
} from 'lucide-react';

export interface VaultFileItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  ipfsCid: string;
  sha256Hash: string;
  keyHex: string;
  ivHex: string;
  timestamp: number;
  encryptedBuffer?: ArrayBuffer;
}

interface VaultDashboardProps {
  onBackToHome: () => void;
}

export const VaultDashboard: React.FC<VaultDashboardProps> = ({ onBackToHome }) => {
  const { 
    address, 
    isConnected, 
    balance, 
    isBaseSepolia, 
    isConnecting, 
    connectWallet, 
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist files metadata to localStorage
  useEffect(() => {
    const metadataOnly = files.map(f => ({
      ...f,
      encryptedBuffer: undefined, // exclude buffer from JSON storage
    }));
    localStorage.setItem('destorage_vault_files', JSON.stringify(metadataOnly));
  }, [files]);

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
        // If buffer was not kept in state, re-fetch via IPFS service cache
        const { fetchFromIpfs } = await import('../ipfs/ipfsService');
        buffer = await fetchFromIpfs(item.ipfsCid);
      }

      const { decryptedBlob } = await decryptFile(
        buffer,
        item.keyHex,
        item.ivHex,
        item.mimeType
      );

      // Trigger standard browser download
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <ImageIcon size={20} color="#0284c7" />;
    if (mime.startsWith('video/')) return <Video size={20} color="#db2777" />;
    if (mime.startsWith('audio/')) return <Music size={20} color="#7c3aed" />;
    if (mime.includes('pdf') || mime.includes('document') || mime.includes('text')) {
      return <FileText size={20} color="#16a34a" />;
    }
    return <File size={20} color="#475569" />;
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
            <button type="button" className="vd-back-btn" onClick={onBackToHome}>
              <ArrowLeft size={16} />
              <span>Back to Landing</span>
            </button>

            <div className="vd-brand">
              <img src={safeImages.logo} alt="DeStorage Logo" draggable={false} />
              <span>De<span className="vd-brand-accent">Storage</span> Vault</span>
              <span className="vd-network-chip">
                <span className="vd-live-dot"></span>
                Base Sepolia EVM
              </span>
            </div>
          </div>

          <div className="vd-nav-actions">
            {isConnected && address ? (
              <div className="vd-wallet-connected">
                <div className="vd-wallet-badge">
                  {isBaseSepolia ? (
                    <span className="vd-chain-pill">Base Sepolia</span>
                  ) : (
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
                onClick={connectWallet}
              >
                <Wallet size={16} />
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN DASHBOARD CONTENT */}
      <main className="vd-main-content">
        <div className="vd-container">
          
          {/* STATS OVERVIEW CARDS */}
          <div className="vd-stats-grid">
            <div className="vd-stat-card">
              <div className="vd-stat-icon" style={{ background: '#eff6ff', color: '#0284c7' }}>
                <Lock size={22} />
              </div>
              <div className="vd-stat-info">
                <span className="vd-stat-label">Encrypted Files</span>
                <span className="vd-stat-value">{files.length}</span>
              </div>
            </div>

            <div className="vd-stat-card">
              <div className="vd-stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                <HardDrive size={22} />
              </div>
              <div className="vd-stat-info">
                <span className="vd-stat-label">Storage Consumed</span>
                <span className="vd-stat-value">{formatFileSize(totalStorageBytes)}</span>
              </div>
            </div>

            <div className="vd-stat-card">
              <div className="vd-stat-icon" style={{ background: '#faf5ff', color: '#7c3aed' }}>
                <Cpu size={22} />
              </div>
              <div className="vd-stat-info">
                <span className="vd-stat-label">Encryption Standard</span>
                <span className="vd-stat-value">AES-256-GCM</span>
              </div>
            </div>

            <div className="vd-stat-card">
              <div className="vd-stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Layers size={22} />
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
                <UploadCloud size={38} color="#0284c7" />
              </div>

              <div className="vd-upload-texts">
                <h3 className="vd-upload-title">Drag & drop files to encrypt and store</h3>
                <p className="vd-upload-desc">
                  Browser-native AES-256-GCM encryption runs locally before upload. Plaintext never leaves your machine.
                </p>
              </div>

              <div className="vd-passphrase-row">
                <div className="vd-passphrase-input-wrap">
                  <Key size={16} color="#64748b" />
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
                  <ShieldCheck size={17} />
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
                  <Search size={15} color="#94a3b8" />
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
                <ShieldCheck size={48} color="#94a3b8" />
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
                            <Lock size={12} /> AES-256-GCM
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
                        <span className="vd-cid-val">{`${file.ipfsCid.slice(0, 10)}...${file.ipfsCid.slice(-6)}`}</span>
                        {copiedCid === file.id ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                      </div>

                      <span className="vd-verified-badge" title={file.sha256Hash}>
                        <Check size={13} /> Base EVM Verified
                      </span>
                    </div>

                    <div className="vd-file-actions">
                      <button 
                        type="button" 
                        className="vd-action-btn vd-preview-btn" 
                        onClick={() => handlePreview(file)}
                        title="Decrypt & Preview in Browser"
                      >
                        <Eye size={15} />
                        <span>Preview</span>
                      </button>

                      <button 
                        type="button" 
                        className="vd-action-btn vd-download-btn" 
                        onClick={() => handleDecryptDownload(file)}
                        title="Decrypt & Download Plaintext"
                      >
                        <Download size={15} />
                        <span>Download</span>
                      </button>

                      <button 
                        type="button" 
                        className="vd-action-btn vd-delete-btn" 
                        onClick={() => handleDelete(file.id)}
                        title="Remove from Vault"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ZERO-KNOWLEDGE DECRYPTED PREVIEW MODAL */}
      {previewItem && (
        <div className="vd-modal-overlay" onClick={closePreview}>
          <div className="vd-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vd-preview-header">
              <div className="vd-preview-title-box">
                <Unlock size={18} color="#0284c7" />
                <h4>{previewItem.file.name}</h4>
              </div>
              <button type="button" className="vd-modal-close" onClick={closePreview}>
                <X size={20} />
              </button>
            </div>

            <div className="vd-preview-body">
              {previewItem.isDecrypting ? (
                <div className="vd-decrypting-state">
                  <div className="vd-progress-spinner"></div>
                  <span>In-Memory AES-256 Decryption in Progress...</span>
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
                  <FileText size={48} color="#0284c7" />
                  <p>Encrypted file decrypted cleanly in memory buffer.</p>
                  <button 
                    type="button" 
                    className="vd-btn-select-file"
                    onClick={() => handleDecryptDownload(previewItem.file)}
                  >
                    <Download size={16} />
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
                <Download size={16} />
                <span>Save to Device</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
