import React, { useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFortAwesome } from '@fortawesome/free-brands-svg-icons';

const SUPPORTED_CHAIN_ID = 84532; // Ethereum mainnet chain ID

// Add network configuration for Base Sepolia
const BASE_SEPOLIA_CONFIG = {
    chainId: SUPPORTED_CHAIN_ID,
    name: 'base-sepolia',
    ensAddress: null, // Explicitly disable ENS
    rpcUrls: ['https://base-sepolia.g.alchemy.com/v2/sBVMn2jVaFsG9K7sTs-85aQhKv7D8-1l'],
};

const GameQuestion = ({ onBuyTickets, contractAddress, contractABI, tokenAddress }) => {
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
                    // Add network configuration to provider
                    const web3Provider = new ethers.providers.Web3Provider(window.ethereum, BASE_SEPOLIA_CONFIG);
                    
                    // (Optional) Remove or adjust resolveName override if not needed.
                    // web3Provider.resolveName = async (name) => {
                    //     if (ethers.utils.isAddress(name)) return name;
                    //     throw new Error("ENS is not supported on this network");
                    // };

                    // Check network
                    const network = await web3Provider.getNetwork();
                    setNetwork(network);

                    if (network.chainId !== SUPPORTED_CHAIN_ID) {
                        setIsSupportedNetwork(false);
                        console.error("Please switch to Base Sepolia");
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

    const contract = useMemo(() => {
        if (!contractAddress || !contractABI || !signer) {
            console.error("Invalid contract config or signer not available");
            return null;
        }
        return new ethers.Contract(contractAddress, contractABI, signer);
    }, [contractAddress, contractABI, signer]);

    const tokenContract = useMemo(() => {
        console.log("Token Address:", tokenAddress);
        console.log("Signer:", signer);
        if (!tokenAddress || !signer) {
            console.error("Invalid token address or signer not available");
            return null;
        }
        return new ethers.Contract(tokenAddress, [
            "function balanceOf(address) view returns (uint256)",
            "function approve(address, uint256)"
        ], signer);
    }, [tokenAddress, signer]);

    useEffect(() => {
        console.log("Contract:", contract);
        console.log("Token Contract:", tokenContract);
        console.log("Signer:", signer);
        console.log("Network:", network);
    }, [contract, tokenContract, signer, network]);

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
        if (!contract || !tokenContract) {
            console.error("Contract or token contract is not initialized");
            return;
        }

        try {
            if (!isQuestionSet) {
                alert("A question must be set before buying tickets.");
                return;
            }

            if (ticketCounts[answerIndex] > 0) {
                // --- New Split-Payment Calculation ---
                const tokenCostPerTicket = ethers.utils.parseUnits("1", 18); // 1 FTT per ticket (with 18 decimals)
                const ticketPrice = ethers.utils.parseEther("0.00001"); // ETH price per ticket
                const userAddress = await signer.getAddress();
                const tokenBalance = await tokenContract.balanceOf(userAddress);
                
                // Determine how many tickets the user can pay for with FTT:
                const ticketsCoveredByTokens = tokenBalance.div(tokenCostPerTicket).toNumber();
                let remainingTickets;
                if (ticketsCoveredByTokens >= ticketCounts[answerIndex]) {
                    remainingTickets = 0;
                } else {
                    remainingTickets = ticketCounts[answerIndex] - ticketsCoveredByTokens;
                }
                
                // Calculate ETH required for the remaining tickets:
                const ethRequired = ticketPrice.mul(remainingTickets);
                
                // Determine how many tickets will be paid with FTT:
                const ticketsUsingFTT = Math.min(ticketCounts[answerIndex], ticketsCoveredByTokens);
                // Calculate the total token amount (in wei) needed for these tickets:
                const tokensToApprove = ethers.BigNumber.from(ticketsUsingFTT).mul(tokenCostPerTicket);
                // --- End of Split-Payment Calculation ---

                // Approve the contract to spend FTT (if any tokens are to be used)
                if (tokensToApprove.gt(0)) {
                    const approveTx = await tokenContract.approve(contractAddress, tokensToApprove);
                    await approveTx.wait();
                }
                
                // Call buyTickets with the full ticket count and the calculated ETH amount:
                const tx = await contract.buyTickets(answerIndex, ticketCounts[answerIndex], { 
                    value: ethRequired, 
                    gasLimit: 300000 
                });
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
                style={{ 
                    color: "#ff4d6d", 
                    fontSize: "60px", 
                }}  
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
