import { Abi, hash } from "starknet";
import { ContractAbi } from "../types";

export const parseAbi = (abi: Abi): ContractAbi =>
  (!!abi.length ? abi : [])
    .filter((func) => func.type === "function")
    .reduce(
      (prev, cur) => ({
        ...prev,
        [hash.getSelectorFromName(cur.name)]: cur,
      }),
      {}
    );
