require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Setting question with the account:", deployer.address);

    const contractAddress = "0x487ca017681aD1138bA0c412FEdD2FeC69412779"; // Replace with your deployed contract address
    const contractABI = require("../src/DungeonCrawler.json").abi;
    const contract = new ethers.Contract(contractAddress, contractABI, deployer);

    const question = "What is the capital of France?";
    const options = ["Paris", "Rome", "Berlin", "Madrid", "Lisbon"];

    const tx = await contract.setQuestion(question, options);
    await tx.wait();
    console.log("Question set successfully:", tx);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error setting question:", error);
        process.exit(1);
    });