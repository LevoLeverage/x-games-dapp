import { ethers } from "ethers";
import React, { useState } from "react";

const GameQuestion = ({ onSetQuestion, onEndRound, onBuyTickets, contractAddress, contractABI }) => {
    const [ticketCounts, setTicketCounts] = useState([0, 0, 0, 0, 0]); // For 5 answers
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '', '', '', '']);
    const [burnPercentage, setBurnPercentage] = useState(900);
    const [feePercentage, setFeePercentage] = useState(100);
    const [prizePercentage, setPrizePercentage] = useState(8000);

    // Setup ethers.js provider and contract instance
    const provider = new ethers.providers.Web3Provider(window.ethereum); // Assuming MetaMask is used
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    const updateTicketCount = (index, value) => {
        const newCounts = [...ticketCounts];
        newCounts[index] = parseInt(value) || 0;
        setTicketCounts(newCounts);
    };

    const buyTickets = async (answerIndex) => {
        try {
            if (ticketCounts[answerIndex] > 0) {
                const ticketPrice = ethers.utils.parseEther("0.00001"); // Replace with the actual ticket price
                const totalCost = ticketPrice.mul(ticketCounts[answerIndex]);
                const tx = await contract.buyTickets(answerIndex, ticketCounts[answerIndex], { value: totalCost });
                await tx.wait(); // Wait for the transaction to be mined
                console.log("Tickets bought successfully:", tx);
                onBuyTickets(answerIndex, ticketCounts[answerIndex]); // Call your callback if needed
            } else {
                alert("Please enter a valid ticket count.");
            }
        } catch (error) {
            console.error("Error buying tickets:", error);
        }
    };

    const handleSetQuestion = async () => {
        try {
            if (question && options.every(option => option)) {
                const tx = await contract.setQuestion(question, options);
                await tx.wait();
                console.log("Question set successfully:", tx);
                onSetQuestion(question, options);
            } else {
                alert("Please enter a valid question and options.");
            }
        } catch (error) {
            console.error("Error setting question:", error);
        }
    };

    const handleEndRound = async () => {
        try {
            if (burnPercentage + feePercentage + prizePercentage <= 10000) {
                const tx = await contract.endRound(burnPercentage, feePercentage, prizePercentage);
                await tx.wait();
                console.log("Round ended successfully:", tx);
                onEndRound(burnPercentage, feePercentage, prizePercentage);
            } else {
                alert("Total percentages must not exceed 100%.");
            }
        } catch (error) {
            console.error("Error ending round:", error);
        }
    };

    return (
        <div className="GameQuestion" style={{ textAlign: "center", marginTop: "20px" }}>
            <h2>What is the capital of France?</h2>
            <div>
                {["Paris", "Rome", "Berlin", "Madrid", "Lisbon"].map((answer, index) => (
                    <div key={index} style={{ margin: "10px" }}>
                        <span>{answer}</span>
                        <input
                            type="number"
                            min="1"
                            value={ticketCounts[index]}
                            onChange={(e) => updateTicketCount(index, e.target.value)}
                            style={{ marginLeft: "10px", width: "50px" }}
                        />
                        <button
                            onClick={() => buyTickets(index)}
                            style={{ marginLeft: "10px" }}
                        >
                            Buy Ticket
                        </button>
                    </div>
                ))}
            </div>

            <h2>Set Initial Question</h2>
            <input
                type="text"
                placeholder="Question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
            />
            {options.map((option, index) => (
                <input
                    key={index}
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[index] = e.target.value;
                        setOptions(newOptions);
                    }}
                />
            ))}
            <button onClick={handleSetQuestion}>Set Question</button>

            <h2>End Round</h2>
            <input
                type="number"
                placeholder="Burn Percentage"
                value={burnPercentage}
                onChange={(e) => setBurnPercentage(Number(e.target.value))}
            />
            <input
                type="number"
                placeholder="Fee Percentage"
                value={feePercentage}
                onChange={(e) => setFeePercentage(Number(e.target.value))}
            />
            <input
                type="number"
                placeholder="Prize Percentage"
                value={prizePercentage}
                onChange={(e) => setPrizePercentage(Number(e.target.value))}
            />
            <button onClick={handleEndRound}>End Round</button>
        </div>
    );
};

export default GameQuestion;

