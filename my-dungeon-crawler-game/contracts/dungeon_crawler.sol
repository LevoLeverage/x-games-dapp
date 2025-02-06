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

    bytes32 private correctAnswerHash; // Hash of the correct answer
    uint256 private correctAnswerIndex; // Correct answer index (revealed at the end of the round)

    bool public isPaused = false; // State variable to track if the round is paused

    IERC20 public freeXTicket; // ERC20 token used as free ticket currency
    IERC20 public ticketToken; // ERC20 token used as the paid ticket currency
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
    event TicketTokenUpdated(address newTicketToken);

    // Update constructor to also initialize the token metadata if desired
    constructor(address _freeXTicket, address _ticketToken) Ownable(msg.sender) {
        freeXTicket = IERC20(_freeXTicket);
        ticketToken = IERC20(_ticketToken);
        // Default values
        burnPercentage = 900; // 9%
        feePercentage = 100;  // 1%
        prizePercentage = 9000; // 90%
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

    function buyTickets(uint256 answerIndex, uint256 numTickets) public onlyIfQuestionSet whenNotPaused {
        require(answerIndex < currentQuestion.options.length, "Invalid answer index.");
        require(numTickets > 0, "Must buy at least one ticket.");

        // Define cost per ticket in free token units.
        uint256 tokenCostPerTicket = 1 * (10 ** 18); // 1 freeXTicket covers 1 ticket
        uint256 totalCost = numTickets * tokenCostPerTicket;

        // Check user's freeXTicket balance.
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

        // For any tickets not covered by free tokens, require payment with ticketToken.
        if (remainingTickets > 0) {
            // ticketPrice is defined in ticketToken units.
            uint256 paidCost = ticketPrice * remainingTickets;
            require(ticketToken.transferFrom(msg.sender, address(this), paidCost), "Ticket token transfer failed");
        }

        // Update the ticket records.
        uint256[] storage userTickets = tickets[msg.sender][round];
        if (userTickets.length == 0) {
            tickets[msg.sender][round] = new uint256[](currentQuestion.options.length);
        }
        tickets[msg.sender][round][answerIndex] += numTickets;
        totalTicketsPerAnswer[round][answerIndex] += numTickets;

        // Add buyer to participants list if not already added.
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

        uint256 prizePool = ticketToken.balanceOf(address(this));
        uint256 burnAmount = (prizePool * burnPercentage) / 10000;
        uint256 feeAmount = (prizePool * feePercentage) / 10000;
        uint256 totalPrizeAmount = (prizePool * prizePercentage) / 10000;

        // Burn TTT tokens by transferring them to the zero address.
        require(ticketToken.transfer(0x000000000000000000000000000000000000dEaD, burnAmount), "Token burn failed");

        // Transfer fees to the owner.
        require(ticketToken.transfer(owner(), feeAmount), "Token fee transfer failed");

        // Distribute prize pool proportionally to winners
        uint256 totalWinningTickets = totalTicketsPerAnswer[round][correctAnswerIndex];
        for (uint256 i = 0; i < allTicketHoldersPerRound[round].length; i++) {
            address user = allTicketHoldersPerRound[round][i];
            uint256 userTickets = tickets[user][round][correctAnswerIndex];
            if (userTickets > 0) {
                uint256 userShare = (totalPrizeAmount * userTickets) / totalWinningTickets;
                require(ticketToken.transfer(user, userShare), "Token prize transfer failed");
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