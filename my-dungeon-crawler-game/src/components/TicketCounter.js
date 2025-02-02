import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTicket, faTrophy } from '@fortawesome/free-solid-svg-icons';

const TicketCounter = ({ tickets, contractAddress, contractABI, walletAddress }) => {
    const [balance, setBalance] = useState(0);
    const [ticketCounts, setTicketCounts] = useState([0, 0, 0, 0, 0]); // Assuming 5 answers

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                console.log("Fetching balance for contract address:", contractAddress);
                const provider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_ALCHEMY_API_KEY, { name: 'base-sepolia', chainId: 84532}); // Use the Infura API key from .env
                console.log("Provider:", provider);
                const balance = await provider.getBalance(contractAddress);
                console.log("Raw balance (in wei):", balance.toString());
                const formattedBalance = ethers.utils.formatEther(balance);
                console.log("Formatted balance (in ETH):", formattedBalance);
                setBalance(parseFloat(formattedBalance).toFixed(5)); // Format to 5 decimal places
            } catch (error) {
                console.error("Error fetching balance:", error);
                }
            };

        const fetchTicketCounts = async () => {
            if (!walletAddress) {
                console.error("Wallet address is not set");
                return;
            }

            try {
                const provider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_ALCHEMY_API_KEY, { name: 'base-sepolia', chainId: 84532});
                const contract = new ethers.Contract(contractAddress, contractABI, provider);
                const counts = await Promise.all(
                    [0, 1, 2, 3, 4].map(async (index) => {
                        try {
                            const count = await contract.getTicketCount(walletAddress, index);
                            console.log(`Ticket count for answer ${index}:`, count.toNumber());
                            return count.toNumber();
                        } catch (error) {
                            console.error(`Error fetching ticket count for answer ${index}:`, error);
                            return 0; // Return 0 if the call reverts
                        }
                    })
                );
                setTicketCounts(counts);
            } catch (error) {
                console.error("Error fetching ticket counts:", error);
            }
        };

        fetchBalance();
        fetchTicketCounts();
        const interval = setInterval(() => {
            fetchBalance();
            fetchTicketCounts();
        }, 1000); // Update every second

        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, [contractAddress, contractABI, walletAddress]);

    return (
        <div className='TicketCounter'>
            <h3> <FontAwesomeIcon icon={faTicket} /> Your Tickets</h3>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
                {ticketCounts.map((count, index) => (
                    <li key={index} style={{ margin: '5px 0' }}>
                        Answer {index + 1}: {count} tickets
                    </li>
                ))}
            </ul>
            <p style={{ margin: '20px 0' }}></p> {/* Inline style for spacing */}
            <h3 style={{ fontSize: 25, color: '#ff4d6d' }}>
                <FontAwesomeIcon icon={faTrophy} /> Prize Pool
            </h3>
            <p>{balance} ETH</p>
        </div>
    );
};

export default TicketCounter;
