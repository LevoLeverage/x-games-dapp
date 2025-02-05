// TicketCounter.js
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTicket, faTrophy } from '@fortawesome/free-solid-svg-icons';

const TicketCounter = ({ walletAddress, contractAddress, contractABI, refreshTicketCounter }) => {
  const [balance, setBalance] = useState(0);
  const [ticketCounts, setTicketCounts] = useState([0, 0, 0, 0, 0]); // Assuming 5 answers

  useEffect(() => {
    const fetchData = async () => {
    console.log("Infura URL:", process.env.REACT_APP_ALCHEMY_BASE_MAINNET_API_KEY);
      if (!walletAddress) return;
      try {
        const provider = new ethers.providers.JsonRpcProvider(
          process.env.REACT_APP_ALCHEMY_BASE_MAINNET_API_KEY,
          { name: 'base-mainnet', chainId: 8453 }
        );
        // Fetch balance of the contract:
        const contractBalance = await provider.getBalance(contractAddress);
        setBalance(parseFloat(ethers.utils.formatEther(contractBalance)).toFixed(5));

        // Create contract instance with provider:
        const contract = new ethers.Contract(contractAddress, contractABI, provider);

        // Fetch ticket counts for indices 0-4:
        const counts = await Promise.all(
          [0, 1, 2, 3, 4].map(async (index) => {
            try {
              const count = await contract.getTicketCount(walletAddress, index);
              return count.toNumber();
            } catch (error) {
              console.error(`Error fetching ticket count for answer ${index}:`, error);
              return 0;
            }
          })
        );
        setTicketCounts(counts);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [walletAddress, refreshTicketCounter, contractAddress, contractABI]);

  return (
    <div className='TicketCounter'>
      <h3><FontAwesomeIcon icon={faTicket} /> Your Tickets</h3>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {ticketCounts.map((count, index) => (
          <li key={index} style={{ margin: '5px 0' }}>
            Answer {index + 1}: {count} tickets
          </li>
        ))}
      </ul>
      <h3 style={{ fontSize: 25, color: '#ff4d6d' }}>
        <FontAwesomeIcon icon={faTrophy} /> Prize Pool
      </h3>
      <p>{balance} ETH</p>
    </div>
  );
};

export default TicketCounter;
