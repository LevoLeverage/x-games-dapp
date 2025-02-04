require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Setting question with the account:", deployer.address);

    const contractAddress = "0xf28759aA898a321fF2092BD1007E8468AdAF7791"; // Replace with your deployed contract address
    const contractABI = require("../src/DungeonCrawler.json").abi;
    const contract = new ethers.Contract(contractAddress, contractABI, deployer);

    const question = "What is the capital of France?";
    const options = ["Paris", "Rome", "Berlin", "Madrid", "Lisbon"];
    const correctAnswer = "Paris";

    // Generate the hash of the correct answer
    const correctAnswerHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(correctAnswer));

    // Send the question, options, and correct answer hash to the contract
    const tx = await contract.setQuestion(question, options, correctAnswerHash);
    await tx.wait();
    console.log("Question set successfully:", tx);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error setting question:", error);
        process.exit(1);
    });