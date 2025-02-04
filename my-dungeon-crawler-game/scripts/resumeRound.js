require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Resuming round with the account:", deployer.address);

    const contractAddress = "0xA773855dfB92F0d0A53858713f46D92Be7244485"; // Replace with your deployed contract address
    const contractABI = require("../artifacts/contracts/dungeon_crawler.sol/DungeonCrawler.json").abi;
    const contract = new ethers.Contract(contractAddress, contractABI, deployer);

    const tx = await contract.resumeRound();
    await tx.wait();
    console.log("Round resumed successfully:", tx);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error resuming round:", error);
        process.exit(1);
    });