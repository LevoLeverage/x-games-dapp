// GameQuestion.js
import React, { useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFortAwesome } from '@fortawesome/free-brands-svg-icons';

const SUPPORTED_CHAIN_ID = 8453; // Base Mainnet chain ID

// Network configuration for Base Mainnet (using Infura)
const BASE_SEPOLIA_CONFIG = {
  chainId: SUPPORTED_CHAIN_ID,
  name: 'base-mainnet',
  rpcUrls: ['https://base-mainnet.infura.io/v3/407ea06009d24d2ba05fa9d2f0f2cf03'],
};

const GameQuestion = ({
  onBuyTickets,
  contractAddress,
  contractABI,
  freeTokenAddress,      // Address for freeXTicket token
  ticketTokenAddress,    // Address for paid ticket token
  endTime,
  tickets
}) => {
  const [ticketCounts, setTicketCounts] = useState([0, 0, 0, 0, 0]);
  const [isQuestionSet, setIsQuestionSet] = useState(false);
  const [signer, setSigner] = useState(null);
  const [network, setNetwork] = useState(null);
  const [isSupportedNetwork, setIsSupportedNetwork] = useState(true);

  // Initialize provider and signer
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const initProvider = async () => {
        try {
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum, BASE_SEPOLIA_CONFIG);
          // Override resolveName to bypass ENS resolution on networks that don't support it
          web3Provider.resolveName = async (name) => {
            if (ethers.utils.isAddress(name)) {
              return name;
            }
            throw new Error("ENS is not supported on this network");
          };
  
          const network = await web3Provider.getNetwork();
          setNetwork(network);
  
          if (network.chainId !== SUPPORTED_CHAIN_ID) {
            setIsSupportedNetwork(false);
            console.error("Please switch to Base Mainnet");
            return;
          }
  
          const web3Signer = web3Provider.getSigner();
          setSigner(web3Signer);
          setIsSupportedNetwork(true);
        } catch (error) {
          console.error("Error initializing provider:", error);
        }
      };
      initProvider();
    } else {
      console.error("Ethereum provider not found. Install MetaMask.");
    }
  }, []);
  

  // Create a contract instance for the main DungeonCrawler contract
  const contract = useMemo(() => {
    if (!contractAddress || !contractABI || !signer) {
      console.error("Invalid contract config or signer not available");
      return null;
    }
    return new ethers.Contract(contractAddress, contractABI, signer);
  }, [contractAddress, contractABI, signer]);

  // Create contract instances for the two tokens:
  const freeTokenContract = useMemo(() => {
    if (!freeTokenAddress || !signer) {
      console.error("Invalid free token address or signer not available");
      return null;
    }
    return new ethers.Contract(freeTokenAddress, [
      "function balanceOf(address) view returns (uint256)",
      "function approve(address,uint256)"
    ], signer);
  }, [freeTokenAddress, signer]);

  const ticketTokenContract = useMemo(() => {
    if (!ticketTokenAddress || !signer) {
      console.error("Invalid ticket token address or signer not available");
      return null;
    }
    return new ethers.Contract(ticketTokenAddress, [
      "function balanceOf(address) view returns (uint256)",
      "function approve(address,uint256)"
    ], signer);
  }, [ticketTokenAddress, signer]);

  useEffect(() => {
    console.log("Contract:", contract);
    console.log("Free Token Contract:", freeTokenContract);
    console.log("Ticket Token Contract:", ticketTokenContract);
    console.log("Signer:", signer);
    console.log("Network:", network);
  }, [contract, freeTokenContract, ticketTokenContract, signer, network]);

  useEffect(() => {
    const checkQuestionSet = async () => {
      if (!contract) {
        console.error("Contract is not initialized");
        return;
      }
      try {
        console.log("Checking if question is set...");
        const question = await contract.currentQuestion();
        console.log("Current question:", question);
        setIsQuestionSet(question.isSet);
      } catch (error) {
        console.error("Error checking if question is set:", error);
      }
    };
    checkQuestionSet();
  }, [contract]);

  const updateTicketCount = (index, value) => {
    const newCounts = [...ticketCounts];
    newCounts[index] = parseInt(value) || 0;
    setTicketCounts(newCounts);
  };

  const buyTickets = async (answerIndex) => {
    if (!contract || !freeTokenContract || !ticketTokenContract) {
      console.error("Contract or token contracts are not initialized");
      return;
    }
    try {
      if (!isQuestionSet) {
        alert("A question must be set before buying tickets.");
        return;
      }
      if (ticketCounts[answerIndex] > 0) {
        // Fetch ticketPrice from the contract:
        const contractTicketPrice = ethers.utils.parseUnits("10000", 18);
        // --- Split-Payment Calculation using tokens only ---
        const freeTokenCostPerTicket = ethers.utils.parseUnits("1", 18); // 1 freeXTicket covers 1 ticket
        const totalFreeCost = freeTokenCostPerTicket.mul(ticketCounts[answerIndex]);

        
        const userAddress = await signer.getAddress();
        const freeBalance = await freeTokenContract.balanceOf(userAddress);
        const ticketsCoveredByFree = freeBalance.div(freeTokenCostPerTicket).toNumber();
  
        let freeTokensToUse = ethers.BigNumber.from(0);
        let remainingTickets = ticketCounts[answerIndex];
        if (ticketsCoveredByFree > 0) {
          if (ticketsCoveredByFree >= ticketCounts[answerIndex]) {
            freeTokensToUse = ethers.BigNumber.from(totalFreeCost);
            remainingTickets = 0;
          } else {
            freeTokensToUse = ethers.BigNumber.from(ticketsCoveredByFree).mul(freeTokenCostPerTicket);
            remainingTickets = ticketCounts[answerIndex] - ticketsCoveredByFree;
          }
          const approveFreeTx = await freeTokenContract.approve(contractAddress, freeTokensToUse);
          await approveFreeTx.wait();
        }
  
        // For remaining tickets, use ticketToken:
        if (remainingTickets > 0) {
          // Use the fetched contractTicketPrice (which is defined in ticketToken units)
          const paidCost = contractTicketPrice.mul(remainingTickets);
          const approvePaidTx = await ticketTokenContract.approve(contractAddress, paidCost);
          await approvePaidTx.wait();
        }
        
        // Call buyTickets (no ETH is sent now)
        const tx = await contract.buyTickets(answerIndex, ticketCounts[answerIndex], { gasLimit: 300000 });
        await tx.wait();
        console.log("Tickets bought successfully. Transaction:", tx);
        onBuyTickets(answerIndex, ticketCounts[answerIndex]);
      } else {
        alert("Please enter a valid ticket count.");
      }
    } catch (error) {
      console.error("Error buying tickets:", error);
    }
  };
  
  // Evaluate if the round is active based on endTime
  const isRoundActive = new Date() < new Date(endTime);

  if (!isSupportedNetwork) {
    return (
      <div className="GameQuestion" style={{ textAlign: "center" }}>
        <h2>Please switch to the Base mainnet to use this application.</h2>
      </div>
    );
  }

  return (
    <div className="GameQuestion" style={{ textAlign: "center" }}>
      <FontAwesomeIcon 
        icon={faFortAwesome}
        style={{ color: "#ff4d6d", fontSize: "60px" }}
      />
      <h2>We are at the entrance of the dungeon, but a group of goblins is blocking the way. What should we do?</h2>
      <div>
        {[
          "1. Attack with the sword.", 
          "2. Attack with a spell.", 
          "3. Hide and wait for them to leave.", 
          "4. Bride them.", 
          "5. Sneak past them."
        ].map((answer, index) => (
          <div key={index} style={{ margin: "10px" }}>
            <span>{answer}</span>
            <input
              type="number"
              min="1"
              value={ticketCounts[index]} 
              onChange={(e) => updateTicketCount(index, e.target.value)}
              style={{ marginLeft: "10px", width: "50px" }}
            />
            <button
              onClick={() => buyTickets(index)}
              disabled={!isRoundActive}
              style={{ marginLeft: "10px" }}
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
