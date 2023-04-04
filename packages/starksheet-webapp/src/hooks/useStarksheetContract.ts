import { useMemo } from "react";
import { Abi, Contract } from "starknet";
import starksheetContractData from "../contract.json";
import { starknetRpcProvider } from "../provider";
import { StarksheetContract } from "../types";

export function useStarksheetContract() {
  const contract = useMemo(
    () =>
      new Contract(
        starksheetContractData.starkSheetAbi as Abi,
        starksheetContractData.address,
        starknetRpcProvider
      ) as StarksheetContract,
    []
  );

  return { contract };
}
