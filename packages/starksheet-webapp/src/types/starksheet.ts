import BN from "bn.js";
import { Abi, FunctionAbi, StructAbi } from "starknet";
import { BigNumberish } from "starknet/utils/number";

type SheetConstructorArgs = {
  name: BigNumberish;
  symbol: BigNumberish;
  owner: BigNumberish;
  merkleRoot: BigNumberish;
  maxPerWallet: BigNumberish;
  rendererAddress: BigNumberish;
};

export type Sheet = {
  name: string;
  symbol: string;
  address: string;
  calldata?: SheetConstructorArgs;
};

export type NewSheet = Required<Sheet>;

export type Starksheet = {
  sheets: Sheet[];
  address: string;
  defaultRenderer: string;
  sheetClassHash: string;
};

// Starknet types
export type ContractAbi = {
  [selector: string]: FunctionAbi | StructAbi;
};

export type InitialContractAbis = {
  [contractAddress: string]: any;
};

export type ContractAbis = {
  [contractAddress: string]: ContractAbi | undefined;
};

export type Status = {
  loading: boolean;
  error: boolean;
  message: string;
};

export type AppStatus = {
  loading: boolean;
  error: boolean;
  message: string;
  sheets: { [address: string]: Status };
};

export type CellData = {
  contractAddress: BN;
  selector: BN;
  calldata: BN[];
  abi?: FunctionAbi;
};

export type CellRendered = {
  id: BN;
  owner: BN;
  value: BN;
  error?: boolean;
  parents?: BN[];
};

export type Cell = CellRendered & CellData;

export type CellValues = {
  [address: string]: Cell[];
};

export type CellGraph = {
  [key: number]: number;
};

export type UpdatedValues = {
  [address: string]: { [key: number]: Cell };
};

export type StarksheetContractData = {
  address: string;
  mathAddress: string;
  starkSheetAbi: Abi;
  sheetAbi: Abi;
  allowlist: { [address: string]: string[] };
  contractAbis: { [address: string]: Abi };
};
