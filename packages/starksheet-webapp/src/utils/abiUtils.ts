import { Abi, FunctionAbi, hash } from "starknet";

export const parseAbi = (abi: Abi): ContractAbi =>
  (!!abi.length ? abi : [])
    .filter((func) => func.type === "function")
    .filter((func) => (func as FunctionAbi)["stateMutability"] === "view")
    .reduce(
      (prev, cur) => ({
        ...prev,
        [hash.getSelectorFromName(cur.name)]: cur,
      }),
      {}
    );

export type ContractAbi = {
  [selector: string]: FunctionAbi;
};

export type InitialContractAbis = {
  [contractAddress: string]: any;
};

export type ContractAbis = {
  [contractAddress: string]: ContractAbi | undefined;
};
