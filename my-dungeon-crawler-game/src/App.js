import React, { useState } from 'react';
import ConnectWallet from './components/ConnectWallet';
import GameQuestion from './components/GameQuestion';
import DungeonCrawlerABI from './DungeonCrawler.json';
import CountdownTimer from './components/CountdownTimer';
import TicketCounter from './components/TicketCounter';
import './App2.css';
import logo from './X-Games Logo.png';

const App = () => {
    const [tickets, setTickets] = useState([0, 0, 0, 0, 0]); // For 5 answers
    const [walletAddress, setWalletAddress] = useState(null);
    // Define two separate addresses:
    const [freeTokenAddress] = useState('0x1121Db68aca8655BB7BeeE9F221e7FcFbEd4cF79');
    const [ticketTokenAddress] = useState('0x6B30e4e6B9d1D2d2c27Dd1E1DBDD4570b6D47849'); // Replace with your paid token address
    const contractAddress = '0x318Ec69c4D76F7924e5770002dF5EDe1e6fBD795'; // Your deployed contract address
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
                    freeTokenAddress={freeTokenAddress}        // for free tickets
                    ticketTokenAddress={ticketTokenAddress}      // for paid tickets
                    endTime={endTime}
                    tickets={tickets}
                />
                <TicketCounter
                    tickets={tickets}
                    refreshTicketCounter={refreshTicketCounter}
                    contractAddress={contractAddress}
                    ticketTokenAddress={ticketTokenAddress}      // for paid tickets
                    contractABI={contractABI}
                    walletAddress={walletAddress}
                />
            </div>
        </div>
    );
};

export default App;
