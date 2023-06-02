import { ChainConfig, ChainId, ChainType } from "../types";
import { EVMProvider } from "./EVMProvider";
import { StarknetProvider } from "./StarknetProvider";
import evmSpreadsheetAbi from "../contracts/spreadsheet/evm.abi.json";
import starknetSpreadsheetAbi from "../contracts/spreadsheet/starknet.abi.json";
import { evmWorksheetAbi, starknetWorksheetAbi } from "../contracts/worksheet";

export const chains: ChainConfig[] = [
  {
    chainId: ChainId.ETHEREUM_MAINNET,
    chainType: ChainType.EVM,
    explorerBaseUrl: 'https://etherscan.io/address/',
    nftBaseUrl: 'https://opensea.io/fr/assets/ethereum/',
    addresses: {
      spreadsheet: process.env.REACT_APP_SPREADSHEET_ADDRESS!,
    },
  },
  {
    chainId: ChainId.ETHEREUM_TESTNET,
    chainType: ChainType.EVM,
    explorerBaseUrl: 'https://goerli.etherscan.io/address/',
    nftBaseUrl: 'https://testnets.opensea.io/assets/goerli/',
    addresses: {
      spreadsheet: process.env.REACT_APP_SPREADSHEET_ADDRESS!,
    },
  },
  {
    chainId: ChainId.STARKNET_MAINNET,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: 'https://starkscan.co/contract/',
    nftBaseUrl: 'https://mintsquare.io/collection/starknet/',
    sequencerUrl: 'https://alpha-mainnet.starknet.io',
    addresses: {
      spreadsheet: process.env.REACT_APP_SPREADSHEET_ADDRESS!,
    },
  },
  {
    chainId: ChainId.STARKNET_TESTNET,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: 'https://testnet.starkscan.co/contract/',
    nftBaseUrl: 'https://mintsquare.io/collection/starknet-testnet/',
    sequencerUrl: 'https://alpha4.starknet.io',
    addresses: {
      spreadsheet: process.env.REACT_APP_SPREADSHEET_ADDRESS!,
    },
  },
];

export const chainImplementations = {
  [ChainType.EVM]: EVMProvider,
  [ChainType.STARKNET]: StarknetProvider,
}

/**
 * References ABIs for every chain type.
 */
export const chainAbi = {
  [ChainType.EVM]: {
    spreadsheet: evmSpreadsheetAbi,
    worksheet: evmWorksheetAbi,
  },
  [ChainType.STARKNET]: {
    spreadsheet: starknetSpreadsheetAbi,
    worksheet: starknetWorksheetAbi,
  },
}

/**
 * Gets a chain config matching the given id.
 */
export function getChainConfigById(id: ChainId) {
  const maybeChain = chains.find((chain) => chain.chainId === id);
  // throw an error if the chain is not found
  if (!maybeChain) {
    throw new Error(`chain ${id} is not configured`);
  }

  return maybeChain;
}
