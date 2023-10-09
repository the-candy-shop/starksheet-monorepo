import { ChainId } from "./ChainId";
import { ChainType } from "./ChainType";

export interface ChainConfig {
  chainId: ChainId;
  chainType: ChainType;
  explorerBaseUrl: string;
  explorerApiUrl?: string;
  explorerApiKey?: string;
  explorerLogo: string;
  nftBaseUrl: string;
  nftLogo: string;
  rpcUrl: string;
  appName: string;
  addresses: {
    spreadsheet: string;
    multisend?: string;
    bytes?: string;
    math: string;
  };
}
