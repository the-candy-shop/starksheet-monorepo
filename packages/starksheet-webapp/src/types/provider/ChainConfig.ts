import { ChainId } from "./ChainId";
import { ChainType } from "./ChainType";

export interface ChainConfig {
  chainId: ChainId;
  chainType: ChainType;
  explorerBaseUrl: string;
  explorerApiUrl?: string;
  nftBaseUrl: string;
  sequencerUrl?: string;
  addresses: {
    spreadsheet: string;
  };
}
