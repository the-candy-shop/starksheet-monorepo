export type Network = "mainnet" | "testnet" | "testnet2" | "devnet";

const rpcUrls = {
  mainnet: process.env.REACT_APP_RPC_NODE_URI_MAINNET as string,
  testnet: process.env.REACT_APP_RPC_NODE_URI_GOERLI as string,
  testnet2: process.env.REACT_APP_RPC_NODE_URI_GOERLI_2 as string,
  devnet: "http://127.0.0.1:5050/rpc",
  docker: "http://127.0.0.1:5050/rpc",
};

const chainIds = {
  mainnet: "SN_MAIN",
  testnet: "SN_GOERLI",
  testnet2: "SN_GOERLI2",
  devnet: "SN_GOERLI",
  docker: "SN_GOERLI",
};

const network = (process.env.REACT_APP_NETWORK as Network) || "devnet";

export const chainId = chainIds[network];
export const rpcUrl = process.env.REACT_APP_RPC_PROVIDER || rpcUrls[network];
