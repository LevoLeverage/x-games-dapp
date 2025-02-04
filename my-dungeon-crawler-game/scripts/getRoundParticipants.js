require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0xA773855dfB92F0d0A53858713f46D92Be7244485"; // Replace with your deployed contract address
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