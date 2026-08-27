// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DeStorageVault - Decentralized Encrypted File Registry on Base Sepolia EVM
 * @author Sanket Padhyal
 * @notice Stores file metadata, encrypted IPFS CIDs, and SHA-256 integrity proofs on-chain.
 */
contract DeStorageVault {
    
    struct FileRecord {
        uint256 fileId;
        address owner;
        string ipfsCid;
        string sha256Hash;
        string fileName;
        uint256 fileSize;
        string mimeType;
        uint256 timestamp;
        string encryptedKeyPayload; // Wrapped with user wallet / recipient key
    }

    uint256 private _fileIdCounter;
    
    // Mapping from fileId => FileRecord
    mapping(uint256 => FileRecord) public files;
    
    // Mapping from owner address => list of file IDs
    mapping(address => uint256[]) private _userFileIds;

    // Mapping from fileId => (viewer address => isAuthorized)
    mapping(uint256 => mapping(address => bool)) public fileAccessList;

    // Events
    event FileEncryptedAndRegistered(
        uint256 indexed fileId,
        address indexed owner,
        string ipfsCid,
        string sha256Hash,
        string fileName,
        uint256 fileSize,
        uint256 timestamp
    );

    event AccessGranted(uint256 indexed fileId, address indexed owner, address indexed recipient);
    event AccessRevoked(uint256 indexed fileId, address indexed owner, address indexed recipient);
    event FileDeleted(uint256 indexed fileId, address indexed owner);

    /**
     * @notice Register an encrypted file on-chain after client-side AES-256-GCM encryption & IPFS pinning.
     */
    function registerFile(
        string calldata ipfsCid,
        string calldata sha256Hash,
        string calldata fileName,
        uint256 fileSize,
        string calldata mimeType,
        string calldata encryptedKeyPayload
    ) external returns (uint256) {
        require(bytes(ipfsCid).length > 0, "IPFS CID required");
        require(bytes(sha256Hash).length > 0, "SHA-256 hash required");

        _fileIdCounter++;
        uint256 newId = _fileIdCounter;

        files[newId] = FileRecord({
            fileId: newId,
            owner: msg.sender,
            ipfsCid: ipfsCid,
            sha256Hash: sha256Hash,
            fileName: fileName,
            fileSize: fileSize,
            mimeType: mimeType,
            timestamp: block.timestamp,
            encryptedKeyPayload: encryptedKeyPayload
        });

        _userFileIds[msg.sender].push(newId);

        emit FileEncryptedAndRegistered(
            newId,
            msg.sender,
            ipfsCid,
            sha256Hash,
            fileName,
            fileSize,
            block.timestamp
        );

        return newId;
    }

    /**
     * @notice Retrieve all file records belonging to a user address.
     */
    function getUserFiles(address user) external view returns (FileRecord[] memory) {
        uint256[] memory ids = _userFileIds[user];
        FileRecord[] memory userFiles = new FileRecord[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            userFiles[i] = files[ids[i]];
        }

        return userFiles;
    }

    /**
     * @notice Grant zero-knowledge access to a recipient wallet.
     */
    function grantAccess(uint256 fileId, address recipient) external {
        require(files[fileId].owner == msg.sender, "Only owner can grant access");
        require(recipient != address(0), "Invalid recipient");

        fileAccessList[fileId][recipient] = true;
        emit AccessGranted(fileId, msg.sender, recipient);
    }

    /**
     * @notice Revoke access from a recipient wallet.
     */
    function revokeAccess(uint256 fileId, address recipient) external {
        require(files[fileId].owner == msg.sender, "Only owner can revoke access");
        fileAccessList[fileId][recipient] = false;
        emit AccessRevoked(fileId, msg.sender, recipient);
    }

    /**
     * @notice Get total files stored on the protocol.
     */
    function totalFiles() external view returns (uint256) {
        return _fileIdCounter;
    }
}
