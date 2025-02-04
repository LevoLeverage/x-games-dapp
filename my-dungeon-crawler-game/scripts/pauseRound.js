require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Pausing round with the account:", deployer.address);

    const contractAddress = "YOUR_DUNGEON_CRAWLER_CONTRACT_ADDRESS"; // Replace with your deployed contract address
    const contractABI = require("../artifacts/contracts/dungeon_crawler.sol/DungeonCrawler.json").abi;
    const contract = new ethers.Contract(contractAddress, contractABI, deployer);

    const tx = await contract.pauseRound();
    await tx.wait();
    console.log("Round paused successfully:", tx);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error pausing round:", error);
        process.exit(1);
    });