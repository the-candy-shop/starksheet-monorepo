import StarkSheetContract from "../contract.json";
import { Abi, Contract } from "starknet";
import { useMemo } from "react";
import { starknetProvider } from "../App";

export function useSheetListContract() {
  const contract = useMemo(
    () =>
      new Contract(
        StarkSheetContract.starkSheetAbi as Abi,
        StarkSheetContract.address,
        starknetProvider
      ),
    []
  );

  return { contract };
}
