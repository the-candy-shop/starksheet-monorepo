import { useContext, useMemo } from "react";
import { Abi, Contract } from "starknet";
import { StarksheetContext } from "../contexts/StarksheetContext";
import starksheetContractData from "../contract.json";
import { starknetRpcProvider } from "../provider";
import { SheetContract } from "../types";

export function useSheetContract() {
  const { selectedSheetAddress } = useContext(StarksheetContext);

  const contract = useMemo(() => {
    return selectedSheetAddress
      ? (new Contract(
          starksheetContractData.sheetAbi as Abi,
          selectedSheetAddress,
          starknetRpcProvider
        ) as SheetContract)
      : undefined;
  }, [selectedSheetAddress]);

  return { contract };
}
