// TicketCounter.js
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTicket, faTrophy } from '@fortawesome/free-solid-svg-icons';

const TicketCounter = ({
  walletAddress,
  contractAddress,
  contractABI,
  refreshTicketCounter,
  ticketTokenAddress // added prop for TTT token (paid ticket token)
}) => {
  const [balance, setBalance] = useState(0);
  const [ticketCounts, setTicketCounts] = useState([0, 0, 0, 0, 0]); // Assuming 5 answers

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Create a provider using your Infura endpoint
        const provider = new ethers.providers.JsonRpcProvider(
          process.env.REACT_APP_ALCHEMY_BASE_MAINNET_API_KEY,
          { name: 'base-mainnet', chainId: 8453 }
        );
        // --- Fetch the prize pool as the TTT token balance held by the contract ---
        if (ticketTokenAddress) {
          const tttTokenContract = new ethers.Contract(ticketTokenAddress, [
            "function balanceOf(address) view returns (uint256)"
          ], provider);
          const tttBalance = await tttTokenContract.balanceOf(contractAddress);
          setBalance(parseFloat(ethers.utils.formatUnits(tttBalance, 18)).toFixed(0));
        } else {
          console.error("Ticket token address not provided.");
        }
      } catch (error) {
        console.error("Error fetching TTT token balance:", error);
      }

      // Only fetch ticket counts if the wallet is connected
      if (!walletAddress) return;
      
      try {
        const provider = new ethers.providers.JsonRpcProvider(
          process.env.REACT_APP_ALCHEMY_BASE_MAINNET_API_KEY,
          { name: 'base-mainnet', chainId: 8453 }
        );
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
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
        console.error("Error fetching ticket counts:", error);
      }
    };

    fetchData();
  }, [walletAddress, refreshTicketCounter, contractAddress, contractABI, ticketTokenAddress]);

  return (
    <div className='TicketCounter'>
      <h3>
        <FontAwesomeIcon icon={faTicket} /> Your Tickets
      </h3>
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
      <p>{balance} $XGAME</p>
    </div>
  );
};

export default TicketCounter;
