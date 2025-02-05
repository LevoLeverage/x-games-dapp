// Import ethers and artifacts from Hardhat
const { ethers, artifacts } = require("hardhat");

// Set your deployed contract address (adjust as needed)
const contractAddress = "0x9eaF85Aba7296520f0604d1CA7305cC0F1C0d212";

// Create an asynchronous function to load and interact with your contract
async function main() {
  // Read the artifact for your contract; ensure "DungeonCrawler" matches the contract name
  const artifact = await artifacts.readArtifact("DungeonCrawler");
  const contractABI = artifact.abi;

  // Set up your provider (using the correct Base Mainnet RPC URL)
  const provider = new ethers.providers.JsonRpcProvider(
    "https://base-mainnet.g.alchemy.com/v2/sBVMn2jVaFsG9K7sTs-85aQhKv7D8-1l",
    { name: "base-mainnet", chainId: 8453 }
  );

  // Create a contract instance using the ABI and provider
  const contract = new ethers.Contract(contractAddress, contractABI, provider);

  // Specify the user address you want to query
  const userAddress = "0xcCCd60B8413617F2d95Cb87d9DC5511993d34129";

  // Now you can call your contract's functions:
  const currentRound = await contract.getCurrentRound();
  const numOptions = await contract.getNumOptions(); // Assuming you added this helper
  const userTickets = await contract.debugUserTickets(userAddress); // Assuming you added this helper

  console.log("Current round:", currentRound.toString());
  console.log("Number of options:", numOptions.toString());
  console.log("User tickets array:", userTickets.map(x => x.toNumber()));

  // Example: call getTicketCount for answer index 3
  const countAnswer3 = await contract.getTicketCount(userAddress, 3);
  console.log("getTicketCount for answer 3:", countAnswer3.toString());
}

// Run the main function
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
