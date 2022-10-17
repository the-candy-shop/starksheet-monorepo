import { Abi, hash } from "starknet";
import { ContractAbi } from "../types";

export const parseAbi = (abi: Abi): ContractAbi =>
  (!!abi.length ? abi : []).reduce(
    (prev, cur) => ({
      ...prev,
      [hash.getSelectorFromName(cur.name)]: cur,
    }),
    {}
  );
