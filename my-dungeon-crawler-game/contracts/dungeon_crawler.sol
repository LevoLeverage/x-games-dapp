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

    IERC20 public freeTicketToken; // ERC20 token used as free ticket currency

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

    constructor(address _freeTicketToken) Ownable(msg.sender) {
        freeTicketToken = IERC20(_freeTicketToken);
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
        return tickets[user][round][answerIndex];
    }

    function getTotalTicketsPerAnswer(uint256 roundNumber, uint256 answerIndex) public view returns (uint256) {
        return totalTicketsPerAnswer[roundNumber][answerIndex];
    }

    function getAllTicketHolders(uint256 roundNumber) public view returns (address[] memory) {
        return allTicketHoldersPerRound[roundNumber];
    }

    function buyTickets(uint256 answerIndex, uint256 numTickets) public payable onlyIfQuestionSet whenNotPaused {
        require(answerIndex < currentQuestion.options.length, "Invalid answer index.");
        require(numTickets > 0, "Must buy at least one ticket.");

        uint256 tokenBalance = freeTicketToken.balanceOf(msg.sender);

        if (tokenBalance > 0) {
            uint256 tokensToUse = tokenBalance >= numTickets ? numTickets : tokenBalance;
            require(freeTicketToken.transferFrom(msg.sender, address(this), tokensToUse), "Token transfer failed");
            numTickets -= tokensToUse;
        }

        if (numTickets > 0) {
            uint256 ethRequired = ticketPrice * numTickets;
            require(msg.value == ethRequired, "Incorrect ETH value sent.");
        }

        // Initialize the user's tickets array if it doesn't exist
        uint256[] storage userTickets = tickets[msg.sender][round];
        if (userTickets.length == 0) {
            tickets[msg.sender][round] = new uint256[](currentQuestion.options.length);
        }

        // Update user tickets and total tickets in a single step
        tickets[msg.sender][round][answerIndex] += numTickets;
        totalTicketsPerAnswer[round][answerIndex] += numTickets;

        // Add participant to the list if not already present
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
}

