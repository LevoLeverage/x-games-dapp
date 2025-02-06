require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying TestTicketToken with account:", deployer.address);

  // Get the contract factory for TestTicketToken
  const TestTicketToken = await ethers.getContractFactory("TestTicketToken");
  
  // Deploy the contract
  const token = await TestTicketToken.deploy();
  await token.deployed();
  
  console.log("TestTicketToken deployed to:", token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment error:", error);
    process.exit(1);
  });