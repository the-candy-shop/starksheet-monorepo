import BN from "bn.js";
import { FunctionAbi } from "starknet";

export type CellData = {
  contractAddress: BN;
  selector: BN;
  calldata: BN[];
  abi?: FunctionAbi;
};

export type CellRendered = {
  id: number;
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
