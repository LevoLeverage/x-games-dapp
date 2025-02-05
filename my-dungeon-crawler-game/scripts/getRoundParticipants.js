require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0x9747963559154b70926a15EeA11d0cBBAf6F00b8"; // Replace with your deployed contract address
    const roundNumber = 0; // Change round number as needed

    const [signer] = await ethers.getSigners();
    const dungeonCrawler = await ethers.getContractAt("DungeonCrawler", contractAddress, signer);
    
    const [participants, ticketsPerParticipant] = await dungeonCrawler.getRoundParticipants(roundNumber);
    console.log(`Participants for round ${roundNumber}:`);
    
    for (let i = 0; i < participants.length; i++) {
        console.log(`Address: ${participants[i]}, Tickets: ${ticketsPerParticipant[i].map(count => count.toString())}`);
    }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error("Error in getRoundParticipants:", error);
      process.exit(1);
  });