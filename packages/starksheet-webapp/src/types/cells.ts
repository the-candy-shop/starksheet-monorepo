import { FunctionAbi } from "starknet";

export type CellData = {
  contractAddress: bigint;
  selector: bigint;
  calldata: bigint[];
  abi?: FunctionAbi;
};

export type CellRendered = {
  id: number;
  owner: bigint;
  value: bigint;
  error?: boolean;
  parents?: bigint[];
};

export type Cell = CellRendered & CellData;

export type CellValues = {
  [address: string]: Cell[];
};

export type CellGraph = {
  [key: number]: number;
};
