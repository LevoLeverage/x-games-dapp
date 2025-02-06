require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Use an existing freeXTicket token address from .env, or fallback to a default (if any)
  const freeXTicketAddress = process.env.EXISTING_FREE_X_TICKET_ADDRESS || "0xYourExistingFreeXTicketAddress";
  console.log("Using FreeXTicket token at:", freeXTicketAddress);

  // Check for an existing ticket token address in the environment.
  let ticketTokenAddress = process.env.EXISTING_TICKET_TOKEN_ADDRESS;
  if (!ticketTokenAddress) {
    console.log("No existing ticket token address provided. Deploying a new TicketToken contract...");
    // Get the contract factory for your test token.
    // Ensure that you have a contract (e.g., TicketToken.sol) that implements an ERC20 token.
    const TicketToken = await ethers.getContractFactory("TestTicketToken");
    // For example, deploy with a name, symbol, and an initial supply (here 1,000,000 tokens with 18 decimals)
    const initialSupply = ethers.utils.parseUnits("1000000000", 18);
    const ticketToken = await TicketToken.deploy("TestTicketToken", "TTT", initialSupply);
    await ticketToken.deployed();
    ticketTokenAddress = ticketToken.address;
    console.log("TicketToken deployed to:", ticketTokenAddress);
  } else {
    console.log("Using existing TicketToken at:", ticketTokenAddress);
  }

  // Get current nonce (to control transaction ordering)
  let nonce = await deployer.getTransactionCount("latest");

  // Deploy DungeonCrawler contract.
  // NOTE: Make sure your DungeonCrawler contract's constructor now accepts two token addresses:
  // constructor(address _freeXTicket, address _ticketToken) { ... }
  const DungeonCrawler = await ethers.getContractFactory("DungeonCrawler");
  const dungeonCrawler = await DungeonCrawler.deploy(freeXTicketAddress, ticketTokenAddress, { nonce });
  await dungeonCrawler.deployed();
  console.log("DungeonCrawler deployed to:", dungeonCrawler.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying contracts:", error);
    process.exit(1);
  });
