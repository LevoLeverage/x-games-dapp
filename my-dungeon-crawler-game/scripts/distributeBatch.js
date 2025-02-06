require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Processing prize distribution batch with account:", owner.address);

  // Replace with your deployed contract address
  const contractAddress = "0x1A7d0b29EA28fc47aCE9C92457173A456B4CFf6b";
  const contractABI = require("../artifacts/contracts/dungeon_crawler.sol/DungeonCrawler.json").abi;
  const contract = new ethers.Contract(contractAddress, contractABI, owner);

  // Define your batch size (for example, process 100 winners per transaction)
  const batchSize = 100;

  try {
    const tx = await contract.distributePrizesBatch(batchSize, { gasLimit: 600000 });
    console.log("Waiting for transaction to be mined...");
    await tx.wait();
    console.log("Batch processed successfully. Transaction hash:", tx.hash);
  } catch (error) {
    console.error("Error processing batch distribution:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script encountered an error:", error);
    process.exit(1);
  });
