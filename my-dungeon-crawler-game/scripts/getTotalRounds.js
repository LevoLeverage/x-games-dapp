require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0xA773855dfB92F0d0A53858713f46D92Be7244485"; // Replace with your deployed contract address
    // Get the deployer (owner) signer
    const [signer] = await ethers.getSigners();
  
    // Get the contract instance
    const dungeonCrawler = await ethers.getContractAt("DungeonCrawler", contractAddress, signer);
    
    const totalRounds = await dungeonCrawler.getTotalRounds();
    console.log("Total rounds:", totalRounds.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error("Error in getTotalRounds:", error);
      process.exit(1);
  });