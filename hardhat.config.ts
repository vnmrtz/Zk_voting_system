import { HardhatUserConfig } from "hardhat/config";
require("dotenv").config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@openzeppelin/hardhat-upgrades");

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.9",
      },
      {
        version: "0.5.0",
      },
    ],
  },
  networks: {
    localhost: {
      url: `http://localhost:8545`,
      gas: 6000000,
      blockGasLimit: 30000000,
    },
  },
};

export default config;
