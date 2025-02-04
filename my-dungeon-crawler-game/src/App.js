import React, { useState } from 'react';
import ConnectWallet from './components/ConnectWallet';
import GameQuestion from './components/GameQuestion';
import DungeonCrawlerABI from './DungeonCrawler.json';
import CountdownTimer from './components/CountdownTimer';
import TicketCounter from './components/TicketCounter';
import './App2.css'; // Ensure you import the CSS file
import logo from './X-Games Logo.png'; // Adjust the path if your logo is in a different location

const App = () => {
    const [tickets, setTickets] = useState([0, 0, 0, 0, 0]); // For 5 answers
    const [walletAddress, setWalletAddress] = useState(null);
    const [tokenAddress] = useState('0xC989E4633acb1AdC043948884B7Fdbfd8D9F56BD');
    const contractAddress = '0xf28759aA898a321fF2092BD1007E8468AdAF7791'; // Replace with your deployed contract address
    const contractABI = DungeonCrawlerABI.abi;

    const handleWalletConnected = (address) => {
        console.log("Wallet connected:", address);
        setWalletAddress(address);
    };

    const handleBuyTickets = (answerIndex, count) => {
        const newTickets = [...tickets];
        newTickets[answerIndex] += count;
        setTickets(newTickets);
        alert(`You bought ${count} tickets for answer ${answerIndex + 1}`);
    };

    // Set endTime to 1 hour from now
    const endTime = '2025-01-31T23:59:59'; // Countdown End Date

    return (
        <div className="App">
            <div className="header-container">
                <img src={logo} className="App-logo" alt="logo" />
                <ConnectWallet onWalletConnected={handleWalletConnected} />
            </div>
            <div className="main-container">
                <CountdownTimer endTime={endTime} />
                <GameQuestion
                    onBuyTickets={handleBuyTickets}
                    contractAddress={contractAddress}
                    contractABI={contractABI}
                    tokenAddress={tokenAddress} // Ensure tokenAddress is passed here
                    endTime={endTime}
                    tickets={tickets}
                />
                 <TicketCounter tickets={tickets} contractAddress={contractAddress} contractABI={contractABI} walletAddress={walletAddress} />
            </div>
        </div>
    );
};

export default App;

