require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0xA773855dfB92F0d0A53858713f46D92Be7244485"; // Your contract address
    const contractABI = require("../artifacts/contracts/dungeon_crawler.sol/DungeonCrawler.json").abi;
    
    const [deployer] = await ethers.getSigners(); // Get the first signer
    const contract = new ethers.Contract(contractAddress, contractABI, deployer);

    const roundNumber = 1;  // Modify round number if needed
    const answerIndex = 1;  // Modify as needed

    const totalTickets = await contract.getTotalTicketsPerAnswer(roundNumber, answerIndex);
    console.log(`Total tickets for round ${roundNumber} and answer index ${answerIndex}: ${totalTickets.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error("Error in getTotalTickets:", error);
      process.exit(1);
  });