require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Ending round with the account:", owner.address);

  // Replace with your deployed contract address
  const contractAddress = "0x1A7d0b29EA28fc47aCE9C92457173A456B4CFf6b"; 
  const contractABI = require("../artifacts/contracts/dungeon_crawler.sol/DungeonCrawler.json").abi;
  const contract = new ethers.Contract(contractAddress, contractABI, owner);

  // Set your parameters here:
  const burnPercentage = 900;     // 9%
  const feePercentage = 100;      // 1%
  const prizePercentage = 9000;   // 90%
  const correctAnswerIndex = 0;   // Winning option index (adjust as needed)
  const correctAnswer = "Paris";  // Must hash to the stored answer hash

  try {
    const tx = await contract.endRound(
      burnPercentage,
      feePercentage,
      prizePercentage,
      correctAnswerIndex,
      correctAnswer,
      { gasLimit: 500000 } // adjust gas limit if needed
    );
    console.log("Waiting for transaction to be mined...");
    await tx.wait();
    console.log("Round ended successfully. Transaction hash:", tx.hash);
  } catch (error) {
    console.error("Error ending round:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script encountered an error:", error);
    process.exit(1);
  });
