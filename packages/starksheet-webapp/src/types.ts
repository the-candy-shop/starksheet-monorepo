import BN from "bn.js";
import { FunctionAbi } from "starknet";

// Starksheet contracts types
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
  [selector: string]: FunctionAbi;
};

export type InitialContractAbis = {
  [contractAddress: string]: any;
};

export type ContractAbis = {
  [contractAddress: string]: ContractAbi | undefined;
};

// Starksheet dapp types
export type AppStatus = {
  loading: boolean;
  error: boolean;
  message: string;
};

export type CellData = {
  contractAddress: BN;
  selector: BN;
  calldata: BN[];
};

export type CellRendered = {
  id: BN;
  owner: BN;
  value: BN;
  error?: boolean;
};

export type Cell = CellRendered & CellData;

export type CellChildren = {
  [key: number]: number;
};

export type UpdatedValues = {
  [key: number]: Cell;
};
