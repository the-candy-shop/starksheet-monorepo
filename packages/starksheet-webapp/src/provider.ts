import { RpcProvider, SequencerProvider } from "starknet";

export const starknetSequencerProvider = new SequencerProvider({
  baseUrl:
    process.env.REACT_APP_NETWORK === "alpha-mainnet"
      ? "https://alpha-mainnet.starknet.io"
      : "https://alpha4.starknet.io",
});

export const starknetRpcProvider = new RpcProvider({
  nodeUrl:
    process.env.REACT_APP_NETWORK === "alpha-mainnet"
      ? process.env.REACT_APP_RPC_NODE_URI_MAINNET || ""
      : process.env.REACT_APP_RPC_NODE_URI_GOERLI || "",
});
