require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0xA773855dfB92F0d0A53858713f46D92Be7244485"; // Replace with your contract address
    const [deployer] = await ethers.getSigners(); // Get the first signer

    const contractABI = require("../artifacts/contracts/dungeon_crawler.sol/DungeonCrawler.json").abi;
    const contract = new ethers.Contract(contractAddress, contractABI, deployer);

    const answerIndex = 0; // Change as needed
    const userAddress = "0xcCCd60B8413617F2d95Cb87d9DC5511993d34129"

    const ticketCount = await contract.getTicketCount(userAddress, answerIndex);
    console.log(`Ticket count for user ${userAddress} and answer index ${answerIndex}: ${ticketCount.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error("Error in getTicketCount:", error);
      process.exit(1);
  });