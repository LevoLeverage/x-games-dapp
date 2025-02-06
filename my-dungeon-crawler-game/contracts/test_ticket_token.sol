// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestTicketToken is ERC20, Ownable {
    constructor() ERC20("TestTicketToken", "TTT") Ownable(msg.sender) {
        _mint(msg.sender, 1000000000 * 10 ** decimals()); // Mint 1,000,000 tokens to the owner
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}