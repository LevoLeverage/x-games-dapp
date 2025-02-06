require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Setting question with the account:", deployer.address);

    const contractAddress = "0x318Ec69c4D76F7924e5770002dF5EDe1e6fBD795"; // Replace with your deployed contract address
    const contractABI = require("../src/DungeonCrawler.json").abi;
    const contract = new ethers.Contract(contractAddress, contractABI, deployer);

    const question = "What is the capital of France?";
    const options = ["Paris", "Rome", "Berlin", "Madrid", "Lisbon"];
    const correctAnswer = "Paris";

    // Generate the hash of the correct answer
    const correctAnswerHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(correctAnswer));

    // Get the current nonce of the deployer
    const nonce = await deployer.getTransactionCount("latest");
    console.log("Using nonce:", nonce);

    // Send the question, options, and correct answer hash to the contract with nonce override
    const tx = await contract.setQuestion(question, options, correctAnswerHash, { nonce });
    await tx.wait();
    console.log("Question set successfully:", tx);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error setting question:", error);
        process.exit(1);
    });