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
    const [tokenAddress] = useState('0x5B259A5A6F5Af7BB6ea30174Ff10F008F2dD4cAb');
    const contractAddress = '0xA773855dfB92F0d0A53858713f46D92Be7244485'; // Replace with your deployed contract address
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
    const endTime = '2025-02-31T23:59:59'; // Countdown End Date

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

//                 <TicketCounter tickets={tickets} contractAddress={contractAddress} contractABI={contractABI} walletAddress={walletAddress} />
