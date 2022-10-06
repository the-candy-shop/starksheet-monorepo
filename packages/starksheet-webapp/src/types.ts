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
