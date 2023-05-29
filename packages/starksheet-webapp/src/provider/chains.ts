import { ChainConfig, ChainId, ChainType } from '../types';
import {EVMProvider} from './EVMProvider';
import {StarknetProvider} from './starknetProvider';

export const chains: ChainConfig[] = [
  {
    chainId: ChainId.ETHEREUM_MAINNET,
    chainType: ChainType.EVM,
    explorerBaseUrl: 'https://etherscan.io/address/',
    nftBaseUrl: 'https://opensea.io/fr/assets/ethereum/',
  },
  {
    chainId: ChainId.ETHEREUM_TESTNET,
    chainType: ChainType.EVM,
    explorerBaseUrl: 'https://goerli.etherscan.io/address/',
    nftBaseUrl: 'https://testnets.opensea.io/assets/goerli/',
  },
  {
    chainId: ChainId.STARKNET_MAINNET,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: 'https://starkscan.co/contract/',
    nftBaseUrl: 'https://mintsquare.io/collection/starknet/',
  },
  {
    chainId: ChainId.STARKNET_TESTNET,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: 'https://testnet.starkscan.co/contract/',
    nftBaseUrl: 'https://mintsquare.io/collection/starknet-testnet/',
  }
];

export const chainImplementations = {
  [ChainType.EVM]: EVMProvider,
  [ChainType.STARKNET]: StarknetProvider,
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
