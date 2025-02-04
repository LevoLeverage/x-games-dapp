require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Ending round with the account:", deployer.address);

    const contractAddress = "0x5A95680E3D3B372b361e2e80CE6AF99098c65311"; // Replace with your deployed contract address
    const contractABI = require("../src/DungeonCrawler.json").abi;
    const contract = new ethers.Contract(contractAddress, contractABI, deployer);

    const burnPercentage = 900; // 9%
    const feePercentage = 100;  // 1%
    const prizePercentage = 8000; // 90%
    const correctAnswerIndex = 0; // Index of the correct answer (e.g., 0 for "Paris")
    const correctAnswer = "Paris"; // The correct answer string

    // Send the parameters to the contract
    const tx = await contract.endRound(burnPercentage, feePercentage, prizePercentage, correctAnswerIndex, correctAnswer);
    await tx.wait();
    console.log("Round ended successfully:", tx);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error ending round:", error);
        process.exit(1);
    });