import React, { useState } from 'react';
import ConnectWallet from './components/ConnectWallet';
import GameQuestion from './components/GameQuestion';
import TicketCounter from './components/TicketCounter';
import DungeonCrawlerABI from './DungeonCrawler.json';
import './App.css'; // Ensure you import the CSS file

const App = () => {
    const [tickets, setTickets] = useState([0, 0, 0, 0, 0]); // For 5 answers
    const contractAddress = '0x487ca017681aD1138bA0c412FEdD2FeC69412779'; // Replace with your deployed contract address
    const contractABI = DungeonCrawlerABI.abi;

    const handleWalletConnected = (address) => {
        console.log("Wallet connected:", address);
    };

    const handleSetQuestion = (question, options) => {
        console.log('Question set:', question, options);
    };

    const handleEndRound = (burnPercentage, feePercentage, prizePercentage) => {
        console.log('Round ended with percentages:', burnPercentage, feePercentage, prizePercentage);
    };

    const handleBuyTickets = (answerIndex, count) => {
        const newTickets = [...tickets];
        newTickets[answerIndex] += count;
        setTickets(newTickets);
        alert(`You bought ${count} tickets for answer ${answerIndex + 1}`);
    };

    return (
        <div className="App">
            <h1 className="App-title">X-Games</h1>
            <ConnectWallet onWalletConnected={handleWalletConnected} />
            <GameQuestion
                onSetQuestion={handleSetQuestion}
                onEndRound={handleEndRound}
                onBuyTickets={handleBuyTickets}
                contractAddress={contractAddress}
                contractABI={contractABI}
            />
            <TicketCounter tickets={tickets} />
        </div>
    );
};

export default App;

