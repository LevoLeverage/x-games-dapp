require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy FreeTicketToken contract first
    const FreeTicketToken = await ethers.getContractFactory("FreeTicketToken");
    const freeTicketToken = await FreeTicketToken.deploy();
    await freeTicketToken.deployed();
    console.log("FreeTicketToken deployed to:", freeTicketToken.address);

    // Deploy DungeonCrawler contract with the address of the FreeTicketToken contract
    const DungeonCrawler = await ethers.getContractFactory("DungeonCrawler");
    const dungeonCrawler = await DungeonCrawler.deploy(freeTicketToken.address);
    await dungeonCrawler.deployed();
    console.log("DungeonCrawler deployed to:", dungeonCrawler.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error deploying contracts:", error);
        process.exit(1);
    });