// noinspection JSUnusedGlobalSymbols

import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "./tasks";
import { accounts, node_url } from "./utils/network";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.13",
    settings: {
      optimizer: {
        enabled: true,
        runs: 2000,
        details: {
          yul: true,
          // Tuning options for the Yul optimizer.
          yulDetails: {
            //   // Improve allocation of stack slots for variables, can free up stack slots early.
            //   // Activated by default if the Yul optimizer is activated.
            stackAllocation: true,
            //   // Select optimization steps to be applied.
            //   // Optional, the optimizer will use the default sequence if omitted.
            optimizerSteps: "dhfoDgvulfnTUtnIf",
          },
        },
      },
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  networks: {
    mainnet: {
      url: node_url("mainnet"),
      accounts: accounts("mainnet"),
      tags: ["mainnet"],
    },
    rinkeby: {
      url: node_url("rinkeby"),
      accounts: accounts("rinkeby"),
      tags: ["staging"],
    },
    hardhat: {
      tags: ["local"],
      blockGasLimit: 10 * 50_000_000, // Geth new default is 50M, increased here for tests
    },
    localhost: {
      timeout: 1_000_000,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  mocha: {
    timeout: 500_000,
  },
};

export default config;
