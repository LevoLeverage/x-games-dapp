import React, { useState } from 'react';

const GameQuestion = ({ onBuyTickets, tickets }) => {
    const [ticketCounts, setTicketCounts] = useState([0, 0, 0, 0, 0]); // For 5 answers

    const updateTicketCount = (index, value) => {
        const newCounts = [...ticketCounts];
        newCounts[index] = parseInt(value) || 0;
        setTicketCounts(newCounts);
    };

    const buyTickets = (answerIndex) => {
        if (ticketCounts[answerIndex] > 0) {
            onBuyTickets(answerIndex, ticketCounts[answerIndex]);
        } else {
            alert("Please enter a valid ticket count.");
        }
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <h2>What is the capital of France?</h2>
            <div>
                {["Paris", "Rome", "Berlin", "Madrid", "Lisbon"].map((answer, index) => (
                    <div key={index} style={{ margin: '10px' }}>
                        <span>{answer}</span>
                        <input
                            type="number"
                            min="1"
                            value={ticketCounts[index]}
                            onChange={(e) => updateTicketCount(index, e.target.value)}
                            style={{ marginLeft: '10px', width: '50px' }}
                        />
                        <button
                            onClick={() => buyTickets(index)}
                            style={{ marginLeft: '10px' }}
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
