import BN from "bn.js";
import { Abi, FunctionAbi, StructAbi } from "starknet";

export type Sheet = {
  name: string;
  address: string;
};

export type Starksheet = {
  sheets: Sheet[];
  address: string;
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

export type AppStatus = {
  loading: boolean;
  error: boolean;
  message: string;
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
};

export type Cell = CellRendered & CellData;

export type CellValues = {
  [address: string]: Cell[];
};

export type CellChildren = {
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
