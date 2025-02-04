require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0xA773855dfB92F0d0A53858713f46D92Be7244485"; // Replace with your contract address
    const [deployer] = await ethers.getSigners(); // Get the first signer

    const contractABI = require("../artifacts/contracts/dungeon_crawler.sol/DungeonCrawler.json").abi;
    const contract = new ethers.Contract(contractAddress, contractABI, deployer);

    const roundNumber = 0;  // Modify round number if needed
    const ticketHolders = await contract.getAllTicketHolders(roundNumber);
    console.log(`Ticket holders for round ${roundNumber}:`, ticketHolders);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error("Error in getAllTicketHolders:", error);
      process.exit(1);
  });