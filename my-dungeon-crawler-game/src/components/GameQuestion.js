import React, { useState } from "react";
import { ethers } from "ethers";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFortAwesome } from '@fortawesome/free-brands-svg-icons';

const GameQuestion = ({ onBuyTickets, contractAddress, contractABI }) => {
    const [ticketCounts, setTicketCounts] = useState([0, 0, 0, 0, 0]); // For 5 answers

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



    return (
        <div className="GameQuestion" style={{ textAlign: "center"}}>
            <FontAwesomeIcon icon={faFortAwesome}
                            style={{ 
                                color: "#ff4d6d", 
                                fontSize: "60px", 
                            }}  />
            <h2>We are at the entrance of the dungeon, but a group of goblins is blocking the way. What should we do?</h2>
            <div>
                {["1. Attack with the sword.", "2. Attack with a spell.", "3. Hide and wait for them to leave.", "4. Bride them.", "5. Sneak past them."].map((answer, index) => (
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
        </div>
    );     
}; 
export default GameQuestion;

