import contractData from "../contracts/contractData.json";
import { ChainConfig, ChainId, ChainType } from "../types";
import { EVMProvider } from "./EVMProvider";
import { StarknetProvider } from "./StarknetProvider";

type SupportedChains =
  | "ethGoerli"
  | "anvil"
  | "starknetMainnet"
  | "starknetTestnet"
  | "starknetTestnet2"
  | "madara"
  | "sharingan"
  | "starknetDevnet";

const chainConfigs: Record<SupportedChains, ChainConfig> = {
  ethGoerli: {
    chainId: ChainId.ETHEREUM_TESTNET,
    chainType: ChainType.EVM,
    explorerBaseUrl: "https://goerli.etherscan.io/address/",
    explorerApiUrl: "https://api-goerli.etherscan.io/api",
    nftBaseUrl: "https://testnets.opensea.io/assets/goerli/",
    rpcUrl: `https://goerli.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
    addresses: {
      spreadsheet: contractData.eth.addresses.goerli.Evmsheet,
      multisend: contractData.eth.addresses.goerli.MultiSendCallOnly,
      math: contractData.eth.addresses.goerli.Math,
    },
  },
  anvil: {
    chainId: ChainId.ANVIL,
    chainType: ChainType.EVM,
    explorerBaseUrl: "https://goerli.etherscan.io/address/",
    explorerApiUrl: "https://api-goerli.etherscan.io/api",
    nftBaseUrl: "https://testnets.opensea.io/assets/goerli/",
    rpcUrl: "0.0.0.0:8545",
    addresses: {
      spreadsheet: contractData.eth.addresses.anvil.Evmsheet,
      multisend: contractData.eth.addresses.anvil.MultiSendCallOnly,
      math: contractData.eth.addresses.anvil.Math,
    },
  },
  starknetMainnet: {
    chainId: ChainId.STARKNET_MAINNET,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: "https://starkscan.co/contract/",
    nftBaseUrl: "https://mintsquare.io/collection/starknet/",
    rpcUrl: `https://starknet-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
    addresses: {
      spreadsheet: contractData.starknet.addresses.mainnet.spreadsheet,
      multisend: undefined,
      math: contractData.starknet.addresses.mainnet.math,
    },
  },
  starknetTestnet: {
    chainId: ChainId.STARKNET_TESTNET,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: "https://testnet.starkscan.co/contract/",
    nftBaseUrl: "https://mintsquare.io/collection/starknet-testnet/",
    rpcUrl: `https://starknet-goerli.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
    addresses: {
      spreadsheet: contractData.starknet.addresses.testnet.spreadsheet,
      multisend: undefined,
      math: contractData.starknet.addresses.testnet.math,
    },
  },
  starknetTestnet2: {
    chainId: ChainId.STARKNET_TESTNET2,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: "https://testnet-2.starkscan.co/contract/",
    nftBaseUrl: "",
    rpcUrl: `https://starknet-goerli2.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
    addresses: {
      spreadsheet: contractData.starknet.addresses.testnet2.spreadsheet,
      multisend: undefined,
      math: contractData.starknet.addresses.testnet2.math,
    },
  },
  starknetDevnet: {
    chainId: ChainId.STARKNET_TESTNET,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: "https://devnet.starkscan.co/contract/",
    nftBaseUrl: "",
    rpcUrl: "http://127.0.0.1:5050/rpc",
    addresses: {
      spreadsheet: contractData.starknet.addresses.devnet.spreadsheet,
      multisend: undefined,
      math: contractData.starknet.addresses.devnet.math,
    },
  },
  madara: {
    chainId: ChainId.STARKNET_TESTNET,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: "",
    nftBaseUrl: "",
    rpcUrl: "http://127.0.0.1:9944",
    addresses: {
      spreadsheet: contractData.starknet.addresses.madara.spreadsheet,
      multisend: undefined,
      math: contractData.starknet.addresses.madara.math,
    },
  },
  sharingan: {
    chainId: ChainId.STARKNET_TESTNET,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: "",
    nftBaseUrl: "",
    rpcUrl: process.env.REACT_APP_SHARINGAN_URL!,
    addresses: {
      spreadsheet: contractData.starknet.addresses.sharingan.spreadsheet,
      multisend: undefined,
      math: contractData.starknet.addresses.sharingan.math,
    },
  },
};

const chainImplementations = {
  [ChainType.EVM]: EVMProvider,
  [ChainType.STARKNET]: StarknetProvider,
};

const chainAbis = {
  [ChainType.EVM]: {
    spreadsheet: contractData.eth.abis.spreadsheet,
    worksheet: contractData.eth.abis.worksheet,
  },
  [ChainType.STARKNET]: {
    spreadsheet: contractData.starknet.abis.spreadsheet,
    worksheet: contractData.starknet.abis.worksheet,
  },
};

const network = (process.env.REACT_APP_NETWORK as SupportedChains) || "devnet";
export const chainConfig = chainConfigs[network];
export const chainAbi = chainAbis[chainConfig.chainType];
export const chainImplementation = chainImplementations[chainConfig.chainType];
