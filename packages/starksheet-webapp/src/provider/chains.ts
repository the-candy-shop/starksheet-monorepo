import { Abi } from "starknet";
import contractData from "../contracts/contractData.json";
import { ChainConfig, ChainId, ChainType } from "../types";
import elementLogo from "./../assets/element.png";
import etherscanLogo from "./../assets/etherscan.svg";
import flexLogo from "./../assets/flex.svg";
import lineaLogo from "./../assets/linea.png";
import openseaLogo from "./../assets/opensea.svg";
import optimismLogo from "./../assets/optimism.svg";
import starknetLogo from "./../assets/starknet.svg";
import wenmoonLogo from "./../assets/wenmoon.png";

import { EVMProvider } from "./EVMProvider";
import { StarknetProvider } from "./StarknetProvider";

type SupportedChains =
  | "goerli"
  | "optimismMainnet"
  | "linea"
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
  // EVM chains
  goerli: {
    appName: "Ethsheet",
    chainId: ChainId.ETHEREUM_TESTNET,
    chainType: ChainType.EVM,
    explorerBaseUrl: "https://goerli.etherscan.io/address/",
    explorerApiUrl: "https://api-goerli.etherscan.io/api",
    explorerApiKey: `${process.env.REACT_APP_GOERLI_EXPLORER_KEY}`,
    explorerLogo: etherscanLogo,
    nftBaseUrl: "https://testnets.opensea.io/assets/goerli/",
    nftLogo: openseaLogo,
    rpcUrl: `https://goerli.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
  },
  optimismMainnet: {
    appName: "Opsheet",
    chainId: ChainId.ETHEREUM_TESTNET,
    chainType: ChainType.EVM,
    explorerBaseUrl: "https://optimistic.etherscan.io/address/",
    explorerApiUrl: "https://api-optimistic.etherscan.io/api",
    explorerApiKey: `${process.env.REACT_APP_OPTIMISM_EXPLORER_KEY}`,
    explorerLogo: optimismLogo,
    nftBaseUrl: "https://wenmoon.market/collection/optimism/",
    nftLogo: wenmoonLogo,
    rpcUrl: `https://optimism-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
  },
  linea: {
    appName: "Lineasheet",
    chainId: ChainId.LINEA_MAINNET,
    chainType: ChainType.EVM,
    explorerBaseUrl: "https://lineascan.build/address/",
    explorerApiUrl: "https://api.lineascan.build/api",
    explorerApiKey: `${process.env.REACT_APP_LINEA_EXPLORER_KEY}`,
    explorerLogo: lineaLogo,
    nftBaseUrl: "https://element.market/assets/linea/",
    nftLogo: elementLogo,
    rpcUrl: `https://linea-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
  },
  anvil: {
    appName: "Ethsheet",
    chainId: ChainId.ANVIL,
    chainType: ChainType.EVM,
    explorerBaseUrl: "https://goerli.etherscan.io/address/",
    explorerApiUrl: "https://api-goerli.etherscan.io/api",
    explorerLogo: etherscanLogo,
    nftBaseUrl: "https://testnets.opensea.io/assets/goerli/",
    nftLogo: openseaLogo,
    rpcUrl: "http://0.0.0.0:8545",
  },
  kakarot: {
    appName: "Kakasheet",
    chainId: ChainId.STARKNET_TESTNET,
    chainType: ChainType.EVM,
    explorerBaseUrl: "",
    explorerLogo: starknetLogo,
    nftBaseUrl: "",
    nftLogo: flexLogo,
    rpcUrl: "http://127.0.0.1:3030",
  },
  // Starknet chains
  mainnet: {
    appName: "Starksheet",
    chainId: ChainId.STARKNET_MAINNET,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: "https://starkscan.co/contract/",
    nftBaseUrl: "https://flexing.gg/starknet/collection/",
    explorerLogo: starknetLogo,
    nftLogo: flexLogo,
    rpcUrl: `https://starknet-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
  },
  testnet: {
    appName: "Starksheet",
    chainId: ChainId.STARKNET_TESTNET,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: "https://testnet.starkscan.co/contract/",
    nftBaseUrl: "https://mintsquare.io/collection/starknet-testnet/",
    explorerLogo: starknetLogo,
    nftLogo: flexLogo,
    rpcUrl: `https://starknet-goerli.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
  },
  testnet2: {
    appName: "Starksheet",
    chainId: ChainId.STARKNET_TESTNET2,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: "https://testnet-2.starkscan.co/contract/",
    nftBaseUrl: "",
    explorerLogo: starknetLogo,
    nftLogo: flexLogo,
    rpcUrl: `https://starknet-goerli2.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
  },
  starknetDevnet: {
    appName: "Starksheet",
    chainId: ChainId.STARKNET_TESTNET,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: "https://devnet.starkscan.co/contract/",
    nftBaseUrl: "",
    explorerLogo: starknetLogo,
    nftLogo: flexLogo,
    rpcUrl: "http://127.0.0.1:5050/rpc",
  },
  katana: {
    appName: "Starksheet",
    chainId: ChainId.KATANA,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: "",
    nftBaseUrl: "",
    explorerLogo: starknetLogo,
    nftLogo: flexLogo,
    rpcUrl: "http://127.0.0.1:5050",
  },
  madara: {
    appName: "Madsheet",
    chainId: ChainId.STARKNET_TESTNET,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: "",
    nftBaseUrl: "",
    explorerLogo: starknetLogo,
    nftLogo: flexLogo,
    rpcUrl: "http://127.0.0.1:9944",
  },
  sharingan: {
    appName: "Madsheet",
    chainId: ChainId.STARKNET_TESTNET,
    chainType: ChainType.STARKNET,
    explorerBaseUrl: "",
    nftBaseUrl: "",
    explorerLogo: starknetLogo,
    nftLogo: flexLogo,
    rpcUrl: process.env.REACT_APP_SHARINGAN_URL!,
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
    x[1].toUpperCase(),
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
