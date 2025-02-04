require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Pausing round with the account:", deployer.address);

    const contractAddress = "0x5A95680E3D3B372b361e2e80CE6AF99098c65311"; // Replace with your deployed contract address
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