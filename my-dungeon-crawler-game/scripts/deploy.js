require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Use an existing FreeTicketToken contract address from .env or hard-code it
    const freeXTicketAddress = process.env.EXISTING_FREE_X_TICKET_ADDRESS || "0xYourExistingTokenAddress";
    console.log("Using FreeTicketToken at:", freeXTicketAddress);

    // Get current nonce
    let nonce = await deployer.getTransactionCount("latest");

    // Deploy DungeonCrawler contract with the address of the existing FreeTicketToken contract and nonce override
    const DungeonCrawler = await ethers.getContractFactory("DungeonCrawler");
    const dungeonCrawler = await DungeonCrawler.deploy(freeXTicketAddress, { nonce });
    await dungeonCrawler.deployed();
    console.log("DungeonCrawler deployed to:", dungeonCrawler.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error deploying contracts:", error);
        process.exit(1);
    });
