import { RpcProvider, SequencerProvider } from "starknet";

export type Network = "mainnet" | "testnet" | "devnet";

const sequencerUrls = {
  mainnet: "https://alpha-mainnet.starknet.io",
  testnet: "https://alpha4.starknet.io",
  devnet: "http://127.0.0.1:5050",
};

const rpcUrls = {
  mainnet: process.env.REACT_APP_RPC_NODE_URI_MAINNET as string,
  testnet: process.env.REACT_APP_RPC_NODE_URI_GOERLI as string,
  devnet: "http://127.0.0.1:5050/rpc",
};

const chainIds = {
  mainnet: "SN_MAIN",
  testnet: "SN_GOERLI",
  devnet: "SN_GOERLI",
};

export const network = (process.env.REACT_APP_NETWORK as Network) || "devnet";

export const starknetSequencerProvider = new SequencerProvider({
  baseUrl: sequencerUrls[network],
});

export const starknetRpcProvider = new RpcProvider({
  nodeUrl: rpcUrls[network],
});

export const chainId = chainIds[network];
