import BN from "bn.js";
import { Abi, FunctionAbi, StructAbi } from "starknet";
import { BigNumberish } from "starknet/utils/number";
import { Cell } from "./cells";

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

export type Onsheet = {
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
export type Uint256Output = { low: BN; high: BN };
