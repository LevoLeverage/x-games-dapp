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
                    
                    // Update resolveName so that valid addresses pass through
                   // web3Provider.resolveName = async (name) => {
                   //     if (ethers.utils.isAddress(name)) return name;
                 //       throw new Error("ENS is not supported on this network");
                //    };

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
                const ticketPrice = ethers.utils.parseEther("0.00001"); // Replace with the actual ticket price
                const tokenBalance = await tokenContract.balanceOf(await signer.getAddress());

                if (tokenBalance.gte(ticketCounts[answerIndex])) {
                    // Use FTT for the entire purchase
                    await tokenContract.approve(contractAddress, ticketCounts[answerIndex]);
                    const tx = await contract.buyTickets(answerIndex, ticketCounts[answerIndex]);
                    await tx.wait(); // Wait for the transaction to be mined
                    console.log("Tickets bought successfully with FTT:", tx);
                } else {
                    // Use FTT for partial payment and ETH for the remainder
                    const tokensToUse = tokenBalance;
                    const remainingTickets = ticketCounts[answerIndex] - tokensToUse;
                    const remainingCost = ticketPrice.mul(remainingTickets);

                    if (tokensToUse.gt(0)) {
                        await tokenContract.approve(contractAddress, tokensToUse);
                    }

                    const tx = await contract.buyTickets(answerIndex, ticketCounts[answerIndex], { value: remainingCost, gasLimit: 300000 });
                    await tx.wait(); // Wait for the transaction to be mined
                    console.log("Tickets bought successfully with FTT and ETH:", tx);
                }

                onBuyTickets(answerIndex, ticketCounts[answerIndex]); // Call your callback if needed
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
        <div className="GameQuestion" style={{ textAlign: "center"}}>
            <FontAwesomeIcon icon={faFortAwesome}
                            style={{ 
                                color: "#ff4d6d", 
                                fontSize: "60px", 
                            }}  />
            <h2>We are at the entrance of the dungeon, but a group of goblins is blocking the way. What should we do?</h2>
            <div>
                {["1. Attack with the sword.", "2. Attack with a spell.", "3. Hide and wait for them to leave.", "4. Bride them.", "5. Sneak past them."].map((answer, index) => (
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

