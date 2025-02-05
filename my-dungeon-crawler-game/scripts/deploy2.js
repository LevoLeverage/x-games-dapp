require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy FreeXTicket contract first
    const FreeXTicket = await ethers.getContractFactory("FreeXTicket");
    const freeXTicket = await FreeXTicket.deploy();
    await freeXTicket.deployed();
    console.log("FreeXTicket deployed to:", freeXTicket.address);

    // Deploy DungeonCrawler contract with the address of the FreeXTicket contract
    const DungeonCrawler = await ethers.getContractFactory("DungeonCrawler");
    const dungeonCrawler = await DungeonCrawler.deploy(freeXTicket.address);
    await dungeonCrawler.deployed();
    console.log("DungeonCrawler deployed to:", dungeonCrawler.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error deploying contracts:", error);
        process.exit(1);
    });