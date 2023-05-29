import { StarknetProvider } from "./starknetProvider";
import {EVMProvider} from './EVMProvider';
import {Web3Provider} from '@ethersproject/providers';

export type Network = "mainnet" | "testnet" | "testnet2" | "devnet";

const ETHEREUM_MAINNET_ID = 1;
const ETHEREUM_GOERLI_ID = 5;

const sequencerUrls = {
  mainnet: "https://alpha-mainnet.starknet.io",
  testnet: "https://alpha4.starknet.io",
  testnet2: "https://alpha4-2.starknet.io",
  devnet: "http://127.0.0.1:5050",
};

const rpcUrls = {
  mainnet: process.env.REACT_APP_RPC_NODE_URI_MAINNET as string,
  testnet: process.env.REACT_APP_RPC_NODE_URI_GOERLI as string,
  testnet2: process.env.REACT_APP_RPC_NODE_URI_GOERLI_2 as string,
  devnet: "http://127.0.0.1:5050/rpc",
};

const chainIds = {
  mainnet: "SN_MAIN",
  testnet: "SN_GOERLI",
  testnet2: "SN_GOERLI2",
  devnet: "SN_GOERLI",
};

const ethChainIds = {
  mainnet: ETHEREUM_MAINNET_ID,
  testnet: ETHEREUM_GOERLI_ID,
  testnet2: ETHEREUM_GOERLI_ID,
  devnet: ETHEREUM_GOERLI_ID,
};

const network = (process.env.REACT_APP_NETWORK as Network) || "devnet";

export const chainId = chainIds[network];
export const rpcUrl = rpcUrls[network];
export const starknetChainProvider = new StarknetProvider(
  rpcUrl,
  sequencerUrls[network]
);

// todo: refactor this hardcoded provider to a custom hook ()
export const evmChainProvider = new EVMProvider('https://etherscan.io/', new Web3Provider(window.ethereum));

export const chainProvider = evmChainProvider;

export const ethChainId = ethChainIds[network];
