import React, { useState } from 'react';
import ConnectWallet from './components/ConnectWallet';
import GameQuestion from './components/GameQuestion';
import TicketCounter from './components/TicketCounter';

const App = () => {
    const [tickets, setTickets] = useState([0, 0, 0, 0, 0]); // For 5 answers

    const handleWalletConnected = (address) => {
        console.log("Wallet connected:", address);
    };

    const handleBuyTickets = (answerIndex, count) => {
        const newTickets = [...tickets];
        newTickets[answerIndex] += count;
        setTickets(newTickets);
        alert(`You bought ${count} tickets for answer ${answerIndex + 1}`);
    };

    return (
        <div>
            <ConnectWallet onWalletConnected={handleWalletConnected} />
            <GameQuestion onBuyTickets={handleBuyTickets} tickets={tickets} />
            <TicketCounter tickets={tickets} />
        </div>
    );
};

export default App;

