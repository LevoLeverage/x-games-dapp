require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    sepolia: {
      url: `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 0x14a34,
    },
    baseMainnet: {
      url: `https://base-mainnet.infura.io/v3/${process.env.ALCHEMY_BASE_MAINNET_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 0x2105, // 8453 in hexadecimal
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
