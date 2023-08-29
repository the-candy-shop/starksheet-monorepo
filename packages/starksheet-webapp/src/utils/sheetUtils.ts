import { BigNumberish } from "starknet";
import { N_COL } from "../config";
import { Cell } from "../types";
import { RC_BOUND } from "./constants";
import { str2hex } from "./hexUtils";
export const resolveContractAddress = (
  values: bigint[],
  contractAddress: bigint
) => {
  return contractAddress < RC_BOUND
    ? values[Number(contractAddress)]
    : contractAddress;
};

export const tokenIdToCellName = (id: number) => {
  const col = ((id % N_COL) + 1 + 9).toString(36).toUpperCase();
  const row = Math.floor(id / N_COL) + 1;
  return `${col}${row}`;
};

export const isDependency = (arg: bigint): boolean => arg % 2n !== 0n;

export function getDependencies(calldata: bigint[]): number[] {
  return calldata.filter(isDependency).map((data) => (Number(data) - 1) / 2);
}

export const getAllDependencies =
  (cells: Cell[], _dependencies: number[]) => (tokenId: number) => {
    const deps = getDependencies(cells[tokenId].calldata);
    deps.forEach((d) => _dependencies.push(d));
    if (deps.includes(tokenId)) {
      // We break here because it's enough to conclude about a circular dep
      return;
    }
    deps.map(getAllDependencies(cells, _dependencies));
  };

export const encodeConst = (_arg: BigNumberish): bigint => {
  try {
    // const is a number
    return BigInt(_arg) * 2n;
  } catch (e) {
    // const is a string
    return BigInt(str2hex(_arg.toString(16))) * 2n;
  }
};

export const encodeTokenId = (_arg: BigNumberish): bigint =>
  BigInt(_arg) * 2n + 1n;

export const cellNameToTokenId = (arg: string) => {
  const col = arg.toLowerCase().charCodeAt(0) - "a".charCodeAt(0);
  const row = parseInt(arg.slice(1)) - 1;
  return col + row * 15;
};
