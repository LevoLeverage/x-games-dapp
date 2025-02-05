require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Checking question with the account:", deployer.address);

    const contractAddress = "0x9747963559154b70926a15EeA11d0cBBAf6F00b8"; // Replace with your deployed contract address
    const contractABI = require("../artifacts/contracts/dungeon_crawler.sol/DungeonCrawler.json").abi;
    const contract = new ethers.Contract(contractAddress, contractABI, deployer);

    const question = await contract.currentQuestion();
    console.log("Current question:", question);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error checking question:", error);
        process.exit(1);
    });