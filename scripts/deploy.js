/**
 * Hardhat / Node Deployment Script for DeStorageVault.sol on Base Sepolia
 */
const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
  console.log("Deploying DeStorageVault to Base Sepolia EVM (Chain ID 84532)...");
  
  const rpcUrl = "https://sepolia.base.org";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  console.log("Connected to Base Sepolia RPC:", rpcUrl);
  console.log("Ready to deploy contract from contracts/DeStorageVault.sol");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
