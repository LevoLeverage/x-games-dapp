// Github: https://github.com/alchemyplatform/alchemy-sdk-js
import { Network, Alchemy } from "alchemy-sdk";

const settings = {
  apiKey: "sBVMn2jVaFsG9K7sTs-85aQhKv7D8-1l",
  network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(settings);

alchemy.core.getBlockNumber("finalized").then(console.log);