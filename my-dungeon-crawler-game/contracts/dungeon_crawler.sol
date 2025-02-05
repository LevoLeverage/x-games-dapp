// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DungeonCrawler is Ownable {
    struct Question {
        string text;
        string[] options;
        bool isSet;
    }

    Question public currentQuestion;
    uint256 public ticketPrice = 0.00001 ether;
    uint256 public round = 0;

    uint256 public burnPercentage;
    uint256 public feePercentage;
    uint256 public prizePercentage;

    bytes32 private correctAnswerHash; // Hash of the correct answer
    uint256 private correctAnswerIndex; // Correct answer index (revealed at the end of the round)

    bool public isPaused = false; // State variable to track if the round is paused

    IERC20 public freeXTicket; // ERC20 token used as free ticket currency
    // New state variables to store token metadata

    // New event to signal FTT info was updated.
    event FreeXTicketUpdated(address newAddress);

    mapping(address => mapping(uint256 => uint256[])) public tickets; // user => round => tickets per answer
    mapping(uint256 => uint256[]) public totalTicketsPerAnswer; // round => tickets per answer
    mapping(uint256 => address[]) public allTicketHoldersPerRound; // round => list of users who purchased tickets
    mapping(address => mapping(uint256 => bool)) private isParticipant; // user => round => is participant

    event QuestionSet(string text, string[] options);
    event TicketPurchased(address indexed buyer, uint256 answerIndex, uint256 numTickets);
    event RoundEnded(uint256 winningOption);
    event FundsDistributed(uint256 burned, uint256 ownerFees, uint256 prizePool);
    event RoundPaused();
    event RoundResumed();

    // Update constructor to also initialize the token metadata if desired
    constructor(address _freeXTicket) Ownable(msg.sender) {
        freeXTicket = IERC20(_freeXTicket);
        // Default values
        burnPercentage = 900; // 9%
        feePercentage = 100;  // 1%
        prizePercentage = 9000; // 90%
    }

    modifier onlyIfQuestionSet() {
        require(currentQuestion.isSet, "A question must be set before buying tickets.");
        _;
    }

    modifier validPercentages(uint256 _burnPercentage, uint256 _feePercentage, uint256 _prizePercentage) {
        require(
            _burnPercentage + _feePercentage + _prizePercentage <= 10000,
            "Percentages must not exceed 100%."
        );
        _;
    }

    modifier whenNotPaused() {
        require(!isPaused, "Round is paused");
        _;
    }

    function setQuestion(string memory _text, string[] memory _options, bytes32 _correctAnswerHash) public onlyOwner {
        require(_options.length > 1, "Must have at least two options.");
        currentQuestion = Question(_text, _options, true);
        correctAnswerHash = _correctAnswerHash;

        delete totalTicketsPerAnswer[round];
        totalTicketsPerAnswer[round] = new uint256[](_options.length);

        // Reset participants for the new round
        for (uint256 i = 0; i < allTicketHoldersPerRound[round].length; i++) {
            isParticipant[allTicketHoldersPerRound[round][i]][round] = false;
        }
        delete allTicketHoldersPerRound[round];

        emit QuestionSet(_text, _options);
    } 

    function getTicketCount(address user, uint256 answerIndex) public view returns (uint256) {
        uint256[] memory userTickets = tickets[user][round];
        // Return 0 if no tickets have been purchased or if the answerIndex is out of bounds.
        if (userTickets.length == 0 || answerIndex >= userTickets.length) {
            return 0;
        }
        return userTickets[answerIndex];
    }



    function getTotalTicketsPerAnswer(uint256 roundNumber, uint256 answerIndex) public view returns (uint256) {
        return totalTicketsPerAnswer[roundNumber][answerIndex];
    }

    function getAllTicketHolders(uint256 roundNumber) public view returns (address[] memory) {
        return allTicketHoldersPerRound[roundNumber];
    }

    function buyTickets(uint256 answerIndex, uint256 numTickets) 
        public 
        payable 
        onlyIfQuestionSet 
        whenNotPaused 
        {
            require(answerIndex < currentQuestion.options.length, "Invalid answer index.");
            require(numTickets > 0, "Must buy at least one ticket.");

            // Define FTT cost per ticket considering 18 decimals (1 FTT = 1e18 units)
            uint256 tokenCostPerTicket = 1 * (10 ** 18);
            uint256 totalTokenCost = numTickets * tokenCostPerTicket;

            // Check the user's FTT balance
            uint256 tokenBalance = freeXTicket.balanceOf(msg.sender);

            // Calculate how many tickets the user's tokens can cover.
            // (Integer division: only full tickets count.)
            uint256 ticketsCoveredByTokens = tokenBalance / tokenCostPerTicket;

            uint256 tokensToUse = 0;
            uint256 remainingTickets = numTickets;

            // If the user has some tokens, use them for as many tickets as possible.
            if(ticketsCoveredByTokens > 0) {
                if(ticketsCoveredByTokens >= numTickets) {
                    // The user has enough tokens to cover all tickets.
                    tokensToUse = totalTokenCost;
                    remainingTickets = 0;
                } else {
                    // Use tokens for as many tickets as possible.
                    tokensToUse = ticketsCoveredByTokens * tokenCostPerTicket;
                    remainingTickets = numTickets - ticketsCoveredByTokens;
                }
                // Transfer the FTT tokens from the user to this contract.
                require(
                    freeXTicket.transferFrom(msg.sender, address(this), tokensToUse), 
                    "Token transfer failed"
                );
            }

            // For any tickets not covered by FTT, require ETH payment.
            // The ticketPrice remains at 0.00001 ETH per ticket.
            if (remainingTickets > 0) {
                uint256 ethRequired = ticketPrice * remainingTickets;
                require(msg.value == ethRequired, "Incorrect ETH value sent.");
            } else {
                require(msg.value == 0, "No ETH required if tokens cover full cost");
            }

            // Update the user's tickets and total tickets accordingly.
            // Initialize the user's tickets array if it doesn't exist.
            uint256[] storage userTickets = tickets[msg.sender][round];
            if (userTickets.length == 0) {
                tickets[msg.sender][round] = new uint256[](currentQuestion.options.length);
            }
            tickets[msg.sender][round][answerIndex] += numTickets;
            totalTicketsPerAnswer[round][answerIndex] += numTickets;

            // Add the buyer to the participants list if not already present.
            if (!isParticipant[msg.sender][round]) {
                isParticipant[msg.sender][round] = true;
                allTicketHoldersPerRound[round].push(msg.sender);
            }

        emit TicketPurchased(msg.sender, answerIndex, numTickets);
        }


    
    function endRound(
        uint256 _burnPercentage,
        uint256 _feePercentage,
        uint256 _prizePercentage,
        uint256 _correctAnswerIndex,
        string memory _correctAnswer
    ) 
    public onlyOwner validPercentages(_burnPercentage, _feePercentage, _prizePercentage) {
        require(currentQuestion.isSet, "No question set to end the round.");
        require(keccak256(abi.encodePacked(_correctAnswer)) == correctAnswerHash, "Incorrect answer revealed.");

        burnPercentage = _burnPercentage;
        feePercentage = _feePercentage;
        prizePercentage = _prizePercentage;
        correctAnswerIndex = _correctAnswerIndex;

        uint256 prizePool = address(this).balance;
        uint256 burnAmount = (prizePool * burnPercentage) / 10000;
        uint256 feeAmount = (prizePool * feePercentage) / 10000;
        uint256 totalPrizeAmount = (prizePool * prizePercentage) / 10000;

        // Burn ETH by sending it to the zero address
        payable(address(0)).transfer(burnAmount);

        // Transfer fees to the owner
        payable(owner()).transfer(feeAmount);

        // Distribute prize pool proportionally to winners
        uint256 totalWinningTickets = totalTicketsPerAnswer[round][correctAnswerIndex];
        for (uint256 i = 0; i < allTicketHoldersPerRound[round].length; i++) {
            address user = allTicketHoldersPerRound[round][i];
            uint256 userTickets = tickets[user][round][correctAnswerIndex];
            if (userTickets > 0) {
                uint256 userShare = (totalPrizeAmount * userTickets) / totalWinningTickets;
                payable(user).transfer(userShare);
            }
        }

        emit FundsDistributed(burnAmount, feeAmount, totalPrizeAmount);
        emit RoundEnded(correctAnswerIndex);

        // Reset the question
        currentQuestion.isSet = false;
        round++;
    }

    function setTicketPrice(uint256 _ticketPrice) public onlyOwner {
        ticketPrice = _ticketPrice;
    }

    function pauseRound() public onlyOwner {
        isPaused = true;
        emit RoundPaused();
    }

    function resumeRound() public onlyOwner {
        isPaused = false;
        emit RoundResumed();
    }
    function getTotalRounds() public view returns (uint256) {
        // The current round number equals the number of completed rounds (starting from 0)
        return round;
    }

    // Returns for a specific round:
    // - an array with all wallet addresses (participants)
    // - an array of arrays containing each wallet's ticket counts (one array per wallet) per answer option
    function getRoundParticipants(uint256 roundNumber) public view returns (address[] memory participants, uint256[][] memory ticketsPerParticipant) {
        participants = allTicketHoldersPerRound[roundNumber];
        uint256 length = participants.length;
        ticketsPerParticipant = new uint256[][](length);
        for (uint256 i = 0; i < length; i++) {
            ticketsPerParticipant[i] = tickets[participants[i]][roundNumber];
        }
    }

    // New function to update the FTT contract information
    function updateFTTInfo(address newTokenAddress) public onlyOwner {
        freeXTicket = IERC20(newTokenAddress);
        emit FreeXTicketUpdated(newTokenAddress);
    }

    function withdraw(address tokenAddress, address payable recipient, uint256 amount) public onlyOwner {
        if (tokenAddress == address(0)) {
            // Withdraw ETH
            require(address(this).balance >= amount, "Insufficient ETH balance");
            (bool sent, ) = recipient.call{value: amount}("");
            require(sent, "Failed to send ETH");
        } else {
            // Withdraw ERC20 tokens
            IERC20 token = IERC20(tokenAddress);
            require(token.balanceOf(address(this)) >= amount, "Insufficient token balance");
            require(token.transfer(recipient, amount), "Token transfer failed");
        }
    }

    // Returns the full tickets array for the current round for a given user.
    function debugUserTickets(address user) public view returns (uint256[] memory) {
        return tickets[user][round];
    }

    // Returns the number of options for the current question.
    function getNumOptions() public view returns (uint256) {
        return currentQuestion.options.length;
    }

    // Returns the current round number.
    function getCurrentRound() public view returns (uint256) {
        return round;
    }

}