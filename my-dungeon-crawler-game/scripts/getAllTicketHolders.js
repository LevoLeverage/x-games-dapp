require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0x9eaF85Aba7296520f0604d1CA7305cC0F1C0d212"; // Replace with your contract address
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