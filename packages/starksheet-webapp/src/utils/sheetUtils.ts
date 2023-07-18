import BN from "bn.js";
import { number } from "starknet";
import { N_COL } from "../config";
import { Cell } from "../types";
import { RC_BOUND } from "./constants";
import { str2hex } from "./hexUtils";
export const resolveContractAddress = (values: BN[], contractAddress: BN) => {
  return contractAddress.lt(RC_BOUND)
    ? values[contractAddress.toNumber()]
    : contractAddress;
};

export const tokenIdToCellName = (id: number) => {
  const col = ((id % N_COL) + 1 + 9).toString(36).toUpperCase();
  const row = Math.floor(id / N_COL) + 1;
  return `${col}${row}`;
};

export const isDependency = (arg: BN): boolean =>
  arg.mod(number.toBN(2)).toNumber() !== 0;

export function getDependencies(calldata: BN[]): number[] {
  return calldata.filter(isDependency).map((data) => (data.toNumber() - 1) / 2);
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

export const encodeConst = (_arg: number.BigNumberish): BN => {
  try {
    return number.toBN(_arg).mul(number.toBN(2));
  } catch (e) {
    return number.toBN(str2hex(_arg.toString(16))).mul(number.toBN(2));
  }
};

export const encodeTokenId = (_arg: number.BigNumberish): BN =>
  number.toBN(_arg).mul(number.toBN(2)).add(number.toBN(1));

export const cellNameToTokenId = (arg: string) => {
  const col = arg.toLowerCase().charCodeAt(0) - "a".charCodeAt(0);
  const row = parseInt(arg.slice(1)) - 1;
  return col + row * 15;
};
