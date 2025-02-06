require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Using owner account:", owner.address);

  const contractAddress = "0x9eaF85Aba7296520f0604d1CA7305cC0F1C0d212"; // Replace with your contract address
  const contractABI = require("../artifacts/contracts/dungeon_crawler.sol/DungeonCrawler.json").abi;
  const contract = new ethers.Contract(contractAddress, contractABI, owner);

  // Set parameters for withdrawal:
  // To withdraw ETH, set tokenAddress to the zero address.
  const tokenAddress = "0x0000000000000000000000000000000000000000"; // For ETH; use actual token address for ERC20
  const recipient = "0x6895301B65585251539a28830b250b817567363E";  // Replace with the recipient address
  const amount = ethers.utils.parseEther("0.0001"); // Amount to withdraw (in ETH)

  console.log(`Attempting withdrawal of ${ethers.utils.formatEther(amount)} ETH to ${recipient}...`);

  const tx = await contract.withdraw(tokenAddress, recipient, amount);
  await tx.wait();
  console.log("Withdrawal successful. Transaction hash:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in withdrawal:", error);
    process.exit(1);
  });