import { Abi, BigNumberish, FunctionAbi, StructAbi } from "starknet";
import { Cell } from "./cells";

export type SheetConstructorArgs = {
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
  nRow: number;
  calldata?: SheetConstructorArgs;
  cellPrice: number;
};

export type NewSheet = Required<Sheet>;

export type Spreadsheet = {
  sheets: Sheet[];
  address: string;
  defaultRenderer: string;
  sheetPrice: number;
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

export type UpdatedValues = {
  [address: string]: { [key: number]: Cell };
};

export type OnsheetContractData = {
  address: string;
  mathAddress: string;
  onsheetAbi: Abi;
  sheetAbi: Abi;
  allowlist: { [address: string]: string[] };
  contractAbis: { [address: string]: Abi };
};

export type Uint256 = { low: BigNumberish; high: BigNumberish };
export type Uint256Output = { low: bigint; high: bigint };
