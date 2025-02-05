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
    const [tokenAddress] = useState('0x1121Db68aca8655BB7BeeE9F221e7FcFbEd4cF79');
    const contractAddress = '0x9eaF85Aba7296520f0604d1CA7305cC0F1C0d212'; // Replace with your deployed contract address
    const contractABI = DungeonCrawlerABI.abi;
    const [refreshTicketCounter, setRefreshTicketCounter] = useState(0);

    const handleWalletConnected = (address) => {
        console.log("Wallet connected:", address);
        setWalletAddress(address);
        setRefreshTicketCounter(prev => prev + 1);
    };

    const handleBuyTickets = (answerIndex, count) => {
        const newTickets = [...tickets];
        newTickets[answerIndex] += count;
        setTickets(newTickets);
        setRefreshTicketCounter(prev => prev + 1);
        alert(`You bought ${count} tickets for answer ${answerIndex + 1}`);
    };

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
                <TicketCounter
                    tickets={tickets}
                    refreshTicketCounter={refreshTicketCounter}
                    contractAddress={contractAddress}
                    contractABI={contractABI}
                    walletAddress={walletAddress}
                />
            </div>
        </div>
    );
};

export default App;
