require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Ending round with the account:", owner.address);

  const contractAddress = "0x318Ec69c4D76F7924e5770002dF5EDe1e6fBD795"; // Replace with your deployed contract address
  const contractABI = require("../artifacts/contracts/dungeon_crawler.sol/DungeonCrawler.json").abi;
  const contract = new ethers.Contract(contractAddress, contractABI, owner);

  // Define parameters for ending the round.
  // Ensure these values match your current question's state.
  const burnPercentage = 900;     // e.g., 9%
  const feePercentage = 100;      // e.g., 1%
  const prizePercentage = 9000;   // e.g., 80%
  const correctAnswerIndex = 0;   // Set this to the winning option index
  const correctAnswer = "Paris";  // Must hash to the stored answer hash

  // Call endRound. If any require fails, the transaction will revert.
  try {
    const tx = await contract.endRound(
      burnPercentage,
      feePercentage,
      prizePercentage,
      correctAnswerIndex,
      correctAnswer
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