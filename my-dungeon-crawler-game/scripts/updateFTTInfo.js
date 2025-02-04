require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0xA773855dfB92F0d0A53858713f46D92Be7244485"; // Replace with your deployed contract address
    const [owner] = await ethers.getSigners();
    const dungeonCrawler = await ethers.getContractAt("DungeonCrawler", contractAddress, owner);

    // New FTT contract info -- update these values as needed.
    const newTokenAddress = "0xc373a69De7Bad9135559E142a551C2D516024f1E";

    const tx = await dungeonCrawler.updateFTTInfo(newTokenAddress);
    await tx.wait();
    console.log("FTT info updated:", newTokenAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error("Error in updateFTTInfo:", error);
      process.exit(1);
  });