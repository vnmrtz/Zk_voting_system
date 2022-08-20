import { HardhatUserConfig } from "hardhat/config";
require('dotenv').config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require('@openzeppelin/hardhat-upgrades');

const config: HardhatUserConfig = {
  solidity: "0.8.9",
};

export default config;
