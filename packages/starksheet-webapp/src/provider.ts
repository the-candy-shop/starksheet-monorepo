import { Provider } from "starknet";

export const starknetProvider = new Provider({
  baseUrl:
    process.env.REACT_APP_NETWORK === "alpha-mainnet"
      ? "https://alpha-mainnet.starknet.io"
      : "https://alpha4.starknet.io",
});
