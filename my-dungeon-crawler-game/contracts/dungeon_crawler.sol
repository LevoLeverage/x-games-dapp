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
    uint256 public ticketPrice = 10000 * (10 ** 18);
    uint256 public round = 0;

    uint256 public burnPercentage;
    uint256 public feePercentage;
    uint256 public prizePercentage;

    bytes32 private correctAnswerHash;
    uint256 private correctAnswerIndex;

    bool public isPaused = false;

    IERC20 public freeXTicket;   // Free ticket token (FXT)
    IERC20 public ticketToken;   // Paid ticket token (TTT)

    event FreeXTicketUpdated(address newAddress);
    event TicketPurchased(address indexed buyer, uint256 answerIndex, uint256 numTickets);
    event RoundEnded(uint256 winningOption);
    event FundsDistributed(uint256 burned, uint256 ownerFees, uint256 prizePool);
    event RoundPaused();
    event RoundResumed();
    event TicketTokenUpdated(address newTicketToken);
    event DistributionBatchProcessed(uint256 startIndex, uint256 endIndex, uint256 round);

    // New state variables for batch distribution:
    bool public roundEnded;              // Indicates if distribution is pending for the round
    uint256 public distributionIndex;    // Index pointer for batch processing
    uint256 public pendingWinningTickets;  // Sum of winning tickets for the round
    uint256 public pendingTotalPrizeAmount;  // Total prize amount to be distributed (in TTT)
    uint256 public pendingCorrectAnswerIndex; // Winning answer index for distribution

    mapping(address => mapping(uint256 => uint256[])) public tickets;
    mapping(uint256 => uint256[]) public totalTicketsPerAnswer;
    mapping(uint256 => address[]) public allTicketHoldersPerRound;
    mapping(address => mapping(uint256 => bool)) private isParticipant;

    event QuestionSet(string text, string[] options);

    // Constructor accepts both token addresses.
    constructor(address _freeXTicket, address _ticketToken) Ownable(msg.sender) {
        freeXTicket = IERC20(_freeXTicket);
        ticketToken = IERC20(_ticketToken);
        burnPercentage = 900;
        feePercentage = 100;
        prizePercentage = 9000;
    }

    function updateTicketToken(address newTicketToken) public onlyOwner {
        ticketToken = IERC20(newTicketToken);
        emit TicketTokenUpdated(newTicketToken);
    }

    modifier onlyIfQuestionSet() {
        require(currentQuestion.isSet, "A question must be set before buying tickets.");
        _;
    }

    modifier validPercentages(uint256 _burnPercentage, uint256 _feePercentage, uint256 _prizePercentage) {
        require(_burnPercentage + _feePercentage + _prizePercentage <= 10000, "Percentages must not exceed 100%.");
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

        for (uint256 i = 0; i < allTicketHoldersPerRound[round].length; i++) {
            isParticipant[allTicketHoldersPerRound[round][i]][round] = false;
        }
        delete allTicketHoldersPerRound[round];

        emit QuestionSet(_text, _options);
    } 

    function getTicketCount(address user, uint256 answerIndex) public view returns (uint256) {
        uint256[] memory userTickets = tickets[user][round];
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

    function buyTickets(uint256 answerIndex, uint256 numTickets) public onlyIfQuestionSet whenNotPaused {
        require(answerIndex < currentQuestion.options.length, "Invalid answer index.");
        require(numTickets > 0, "Must buy at least one ticket.");

        uint256 tokenCostPerTicket = 1 * (10 ** 18); // 1 FXT per ticket
        uint256 totalCost = numTickets * tokenCostPerTicket;

        uint256 freeBalance = freeXTicket.balanceOf(msg.sender);
        uint256 ticketsCoveredByFree = freeBalance / tokenCostPerTicket;

        uint256 freeTokensToUse = 0;
        uint256 remainingTickets = numTickets;
        if (ticketsCoveredByFree > 0) {
            if (ticketsCoveredByFree >= numTickets) {
                freeTokensToUse = totalCost;
                remainingTickets = 0;
            } else {
                freeTokensToUse = ticketsCoveredByFree * tokenCostPerTicket;
                remainingTickets = numTickets - ticketsCoveredByFree;
            }
            require(freeXTicket.transferFrom(msg.sender, address(this), freeTokensToUse), "Free token transfer failed");
        }

        if (remainingTickets > 0) {
            // ticketPrice is defined in ticketToken units.
            uint256 paidCost = ticketPrice * remainingTickets;
            require(ticketToken.transferFrom(msg.sender, address(this), paidCost), "Ticket token transfer failed");
        }

        uint256[] storage userTickets = tickets[msg.sender][round];
        if (userTickets.length == 0) {
            tickets[msg.sender][round] = new uint256[](currentQuestion.options.length);
        }
        tickets[msg.sender][round][answerIndex] += numTickets;
        totalTicketsPerAnswer[round][answerIndex] += numTickets;

        if (!isParticipant[msg.sender][round]) {
            isParticipant[msg.sender][round] = true;
            allTicketHoldersPerRound[round].push(msg.sender);
        }

        emit TicketPurchased(msg.sender, answerIndex, numTickets);
    }

    // Modified endRound that calculates distribution amounts but doesn't loop over all winners.
    function endRound(
        uint256 _burnPercentage,
        uint256 _feePercentage,
        uint256 _prizePercentage,
        uint256 _correctAnswerIndex,
        string memory _correctAnswer
    ) public onlyOwner validPercentages(_burnPercentage, _feePercentage, _prizePercentage) {
        require(currentQuestion.isSet, "No question set to end the round.");
        require(keccak256(abi.encodePacked(_correctAnswer)) == correctAnswerHash, "Incorrect answer revealed.");

        burnPercentage = _burnPercentage;
        feePercentage = _feePercentage;
        prizePercentage = _prizePercentage;
        correctAnswerIndex = _correctAnswerIndex;

        // Use ticketToken balance as the prize pool.
        uint256 prizePool = ticketToken.balanceOf(address(this));
        uint256 burnAmt = (prizePool * burnPercentage) / 10000;
        uint256 feeAmt = (prizePool * feePercentage) / 10000;
        uint256 totalPrizeAmt = (prizePool * prizePercentage) / 10000;

        // Execute burn and fee transfers.
        require(ticketToken.transfer(0x000000000000000000000000000000000000dEaD, burnAmt), "Token burn failed");
        require(ticketToken.transfer(owner(), feeAmt), "Token fee transfer failed");

        // Save distribution data for batch processing.
        pendingTotalPrizeAmount = totalPrizeAmt;
        pendingCorrectAnswerIndex = _correctAnswerIndex;
        pendingWinningTickets = totalTicketsPerAnswer[round][_correctAnswerIndex];
        roundEnded = true;
        distributionIndex = 0;

        emit RoundEnded(_correctAnswerIndex);
    }

    // New function for batch processing the reward distribution.
    function distributePrizesBatch(uint256 batchSize) public onlyOwner {
        require(roundEnded, "Round not ended or already distributed");
        uint256 totalWinners = allTicketHoldersPerRound[round].length;
        require(batchSize > 0 && distributionIndex < totalWinners, "Invalid batch size or distribution complete");

        uint256 endIndex = distributionIndex + batchSize;
        if (endIndex > totalWinners) {
            endIndex = totalWinners;
        }

        for (uint256 i = distributionIndex; i < endIndex; i++) {
            address user = allTicketHoldersPerRound[round][i];
            uint256 userTickets = tickets[user][round][pendingCorrectAnswerIndex];
            if (userTickets > 0 && pendingWinningTickets > 0) {
                uint256 userShare = (pendingTotalPrizeAmount * userTickets) / pendingWinningTickets;
                require(ticketToken.transfer(user, userShare), "Token prize transfer failed");
            }
        }
        emit DistributionBatchProcessed(distributionIndex, endIndex, round);
        distributionIndex = endIndex;
        // If all winners have been processed, mark distribution as complete.
        if (distributionIndex >= totalWinners) {
            roundEnded = false;
            // Optionally, reset currentQuestion.isSet to false or perform other cleanup.
            currentQuestion.isSet = false;
            round++; // Advance to next round.
        }
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
        return round;
    }

    function getRoundParticipants(uint256 roundNumber) public view returns (address[] memory participants, uint256[][] memory ticketsPerParticipant) {
        participants = allTicketHoldersPerRound[roundNumber];
        uint256 length = participants.length;
        ticketsPerParticipant = new uint256[][](length);
        for (uint256 i = 0; i < length; i++) {
            ticketsPerParticipant[i] = tickets[participants[i]][roundNumber];
        }
    }

    function updateFTTInfo(address newTokenAddress) public onlyOwner {
        freeXTicket = IERC20(newTokenAddress);
        emit FreeXTicketUpdated(newTokenAddress);
    }

    function withdraw(address tokenAddress, address payable recipient, uint256 amount) public onlyOwner {
        if (tokenAddress == address(0)) {
            require(address(this).balance >= amount, "Insufficient ETH balance");
            (bool sent, ) = recipient.call{value: amount}("");
            require(sent, "Failed to send ETH");
        } else {
            IERC20 token = IERC20(tokenAddress);
            require(token.balanceOf(address(this)) >= amount, "Insufficient token balance");
            require(token.transfer(recipient, amount), "Token transfer failed");
        }
    }

    function debugUserTickets(address user) public view returns (uint256[] memory) {
        return tickets[user][round];
    }

    function getNumOptions() public view returns (uint256) {
        return currentQuestion.options.length;
    }

    function getCurrentRound() public view returns (uint256) {
        return round;
    }
}
