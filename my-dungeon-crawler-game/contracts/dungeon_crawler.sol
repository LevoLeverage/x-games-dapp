// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";

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

    mapping(address => mapping(uint256 => uint256[])) public tickets; // user => round => tickets per answer
    mapping(uint256 => uint256[]) public totalTicketsPerAnswer; // round => tickets per answer
    address[] public allTicketHolders; // List of users who purchased tickets in the current round
    mapping(address => bool) private isParticipant; // To track unique participants for the round

    event QuestionSet(string text, string[] options);
    event TicketPurchased(address indexed buyer, uint256 answerIndex, uint256 numTickets);
    event RoundEnded(uint256 winningOption);
    event FundsDistributed(uint256 burned, uint256 ownerFees, uint256 prizePool);

    constructor() Ownable(msg.sender) {
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

    function setQuestion(string memory _text, string[] memory _options) public onlyOwner {
        require(_options.length > 1, "Must have at least two options.");
        currentQuestion = Question(_text, _options, true);

        delete totalTicketsPerAnswer[round];
        totalTicketsPerAnswer[round] = new uint256[](_options.length);

        // Reset participants for the new round
        for (uint256 i = 0; i < allTicketHolders.length; i++) {
            isParticipant[allTicketHolders[i]] = false;
        }
        delete allTicketHolders;

        emit QuestionSet(_text, _options);
    } 

    function getTicketCount(address user, uint256 answerIndex) public view returns (uint256) {
        return tickets[user][round][answerIndex];
    }

    function buyTickets(uint256 answerIndex, uint256 numTickets) public payable onlyIfQuestionSet {
    require(answerIndex < currentQuestion.options.length, "Invalid answer index.");
    require(numTickets > 0, "Must buy at least one ticket.");
    require(msg.value == ticketPrice * numTickets, "Incorrect ETH value sent.");

    // Initialize the user's tickets array if it doesn't exist
    uint256[] storage userTickets = tickets[msg.sender][round];
    if (userTickets.length == 0) {
        tickets[msg.sender][round] = new uint256[](currentQuestion.options.length);
    }

    // Update user tickets and total tickets in a single step
    tickets[msg.sender][round][answerIndex] += numTickets;
    totalTicketsPerAnswer[round][answerIndex] += numTickets;

    // Add participant to the list if not already present
    if (!isParticipant[msg.sender]) {
        isParticipant[msg.sender] = true;
        allTicketHolders.push(msg.sender);
    }

    emit TicketPurchased(msg.sender, answerIndex, numTickets);
    }

    function endRound(
        uint256 _burnPercentage,
        uint256 _feePercentage,
        uint256 _prizePercentage
    ) 
    public onlyOwner validPercentages(_burnPercentage, _feePercentage, _prizePercentage) {
        require(currentQuestion.isSet, "No question set to end the round.");

        burnPercentage = _burnPercentage;
        feePercentage = _feePercentage;
        prizePercentage = _prizePercentage;

        uint256 prizePool = address(this).balance;
        uint256 burnAmount = (prizePool * burnPercentage) / 10000;
        uint256 feeAmount = (prizePool * feePercentage) / 10000;
        uint256 totalPrizeAmount = (prizePool * prizePercentage) / 10000;

        // Burn ETH by sending it to the zero address
        payable(address(0)).transfer(burnAmount);

        // Transfer fees to the owner
        payable(owner()).transfer(feeAmount);

        // Determine winning option
        uint256 winningOption = 0;
        uint256 maxTickets = 0;
        for (uint256 i = 0; i < totalTicketsPerAnswer[round].length; i++) {
            if (totalTicketsPerAnswer[round][i] > maxTickets) {
                maxTickets = totalTicketsPerAnswer[round][i];
                winningOption = i;
            }
        }

        // Distribute prize pool proportionally to winners
        for (uint256 i = 0; i < allTicketHolders.length; i++) {
            address user = allTicketHolders[i];
            uint256 userTickets = tickets[user][round][winningOption];
            if (userTickets > 0) {
                uint256 userShare = (totalPrizeAmount * userTickets) / maxTickets;
                payable(user).transfer(userShare);
            }
        }

        emit FundsDistributed(burnAmount, feeAmount, totalPrizeAmount);
        emit RoundEnded(winningOption);

        // Reset the question
        currentQuestion.isSet = false;
        round++;
    }

    function setTicketPrice(uint256 _ticketPrice) public onlyOwner {
        ticketPrice = _ticketPrice;
    }
}

