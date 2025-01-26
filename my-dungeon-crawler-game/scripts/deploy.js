require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment script...");

  try {
    const [deployer] = await ethers.getSigners();
    const balance = await deployer.getBalance();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");

    console.log("Getting contract factory...");
    const DungeonCrawler = await ethers.getContractFactory("DungeonCrawler");
    console.log("Contract factory loaded...");

    const dungeonCrawler = await DungeonCrawler.deploy();
    await dungeonCrawler.deployed();

    console.log("DungeonCrawler deployed to:", dungeonCrawler.address);
  } catch (error) {
    console.error("Error deploying contract:", error);
  }

  console.log("Deployment script finished.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Error in main function:", error);
  process.exit(1);
});
