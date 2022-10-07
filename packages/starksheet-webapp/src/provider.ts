import { RpcProvider, SequencerProvider } from "starknet";

export const starknetSequencerProvider = new SequencerProvider({
  baseUrl:
    process.env.REACT_APP_NETWORK === "SN_MAIN"
      ? "https://SN_MAIN.starknet.io"
      : "https://alpha4.starknet.io",
});

export const starknetRpcProvider = new RpcProvider({
  nodeUrl:
    process.env.REACT_APP_NETWORK === "SN_MAIN"
      ? process.env.REACT_APP_RPC_NODE_URI_MAINNET || ""
      : process.env.REACT_APP_RPC_NODE_URI_GOERLI || "",
});
