import { Abi, FunctionAbi, hash } from "starknet";
import { ContractAbi } from "../types";

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
