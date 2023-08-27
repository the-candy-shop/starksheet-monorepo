import { ChainId } from "./ChainId";
import { ChainType } from "./ChainType";

type NetworkName = "mainnet-alpha" | "goerli-alpha" | "goerli-alpha-2";

export interface ChainConfig {
  chainId: ChainId;
  chainType: ChainType;
  explorerBaseUrl: string;
  explorerApiUrl?: string;
  nftBaseUrl: string;
  rpcUrl: string;
  appName: string;
  addresses: {
    spreadsheet: string;
    multisend?: string;
    bytes?: string;
    math: string;
  };
}
