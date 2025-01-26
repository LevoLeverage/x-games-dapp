require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Ending round with the account:", deployer.address);

    const contractAddress = "0x487ca017681aD1138bA0c412FEdD2FeC69412779"; // Replace with your deployed contract address
    const contractABI = require("../src/DungeonCrawler.json").abi;
    const contract = new ethers.Contract(contractAddress, contractABI, deployer);

    const burnPercentage = 900; // 9%
    const feePercentage = 100;  // 1%
    const prizePercentage = 8000; // 90%

    const tx = await contract.endRound(burnPercentage, feePercentage, prizePercentage);
    await tx.wait();
    console.log("Round ended successfully:", tx);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error ending round:", error);
        process.exit(1);
    });