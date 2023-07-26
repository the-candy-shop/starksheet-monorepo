import { Abi } from "starknet";
import contractData from "../contracts/contractData.json";
import { ChainConfig, ChainId, ChainType } from "../types";
import { EVMProvider } from "./EVMProvider";
import { StarknetProvider } from "./StarknetProvider";

type SupportedChains =
  | "goerli"
  | "anvil"
  | "mainnet"
  | "testnet"
  | "testnet2"
  | "madara"
  | "katana"
  | "sharingan"
  | "kakarot"
  | "starknetDevnet";

const chainConfigs: Record<SupportedChains, Omit<ChainConfig, "addresses">> = {
  goerli: {
    appName: "Ethsheet",
    chainId: ChainId.ETHEREUM_TESTNET,
    chainType: ChainType.EVM,
    explorerBaseUrl: "https://goerli.etherscan.io/address/",
    explorerApiUrl: "https://api-goerli.etherscan.io/api",
    nftBaseUrl: "https://testnets.opensea.io/assets/goerli/",
    rpcUrl: `https://goerli.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
  },
  anvil: {
    appName: "Ethsheet",
    chainId: ChainId.ANVIL,
    chainType: ChainType.EVM,
    explorerBaseUrl: "https://goerli.etherscan.io/address/",
    explorerApiUrl: "https://api-goerli.etherscan.io/api",
    nftBaseUrl: "https://testnets.opensea.io/assets/goerli/",
    rpcUrl: "http://0.0.0.0:8545",
  },
  mainnet: {
    appName: "Starksheet",
    chainId: ChainId.STARKNET_MAINNET,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: "https://starkscan.co/contract/",
    nftBaseUrl: "https://mintsquare.io/collection/starknet/",
    rpcUrl: `https://starknet-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
    gateway: "mainnet-alpha",
  },
  testnet: {
    appName: "Starksheet",
    chainId: ChainId.STARKNET_TESTNET,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: "https://testnet.starkscan.co/contract/",
    nftBaseUrl: "https://mintsquare.io/collection/starknet-testnet/",
    rpcUrl: `https://starknet-goerli.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
    gateway: "goerli-alpha",
  },
  testnet2: {
    appName: "Starksheet",
    chainId: ChainId.STARKNET_TESTNET2,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: "https://testnet-2.starkscan.co/contract/",
    nftBaseUrl: "",
    rpcUrl: `https://starknet-goerli2.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
    gateway: "goerli-alpha-2",
  },
  starknetDevnet: {
    appName: "Starksheet",
    chainId: ChainId.STARKNET_TESTNET,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: "https://devnet.starkscan.co/contract/",
    nftBaseUrl: "",
    rpcUrl: "http://127.0.0.1:5050/rpc",
  },
  katana: {
    appName: "Starksheet",
    chainId: ChainId.STARKNET_TESTNET,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: "",
    nftBaseUrl: "",
    rpcUrl: "http://127.0.0.1:5050",
  },
  madara: {
    appName: "Madsheet",
    chainId: ChainId.STARKNET_TESTNET,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: "",
    nftBaseUrl: "",
    rpcUrl: "http://127.0.0.1:9944",
  },
  sharingan: {
    appName: "Madsheet",
    chainId: ChainId.STARKNET_TESTNET,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: "",
    nftBaseUrl: "",
    rpcUrl: process.env.REACT_APP_SHARINGAN_URL!,
  },
  kakarot: {
    appName: "Kakasheet",
    chainId: ChainId.STARKNET_TESTNET,
    chainType: ChainType.EVM,
    explorerBaseUrl: "",
    nftBaseUrl: "",
    rpcUrl: "http://127.0.0.1:3030",
  },
};

const chainImplementations = {
  [ChainType.EVM]: EVMProvider,
  [ChainType.STARKNET]: StarknetProvider,
};

const chainAbis = {
  [ChainType.EVM]: {
    spreadsheet: contractData.abis.eth.spreadsheet as Abi,
    worksheet: contractData.abis.eth.worksheet as Abi,
  },
  [ChainType.STARKNET]: {
    spreadsheet: contractData.abis.starknet.spreadsheet as Abi,
    worksheet: contractData.abis.starknet.worksheet as Abi,
  },
};

const network =
  (process.env.REACT_APP_NETWORK!.replace(/-./g, (x) =>
    x[1].toUpperCase()
  ) as SupportedChains) || "starknetDevnet";

export const chainConfig: ChainConfig = {
  ...chainConfigs[network],
  rpcUrl: process.env.REACT_APP_RPC_URL || chainConfigs[network].rpcUrl,
  addresses: contractData.network.addresses,
};
export const chainAbi = chainAbis[chainConfig.chainType] as {
  spreadsheet: Abi;
  worksheet: Abi;
};
export const chainImplementation = chainImplementations[chainConfig.chainType];
export const deployedAbis = contractData.network.deployedAbis;
