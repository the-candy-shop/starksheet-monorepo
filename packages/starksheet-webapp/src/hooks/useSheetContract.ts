import { useContext, useMemo } from "react";
import { Abi, Contract } from "starknet";
import { OnsheetContext } from "../contexts/OnsheetContext";
import onsheetContractData from "../contract.json";
import { starknetRpcProvider } from "../provider";
import { SheetContract } from "../types";

export function useSheetContract() {
  const { selectedSheetAddress } = useContext(OnsheetContext);

  const contract = useMemo(() => {
    return selectedSheetAddress
      ? (new Contract(
          onsheetContractData.sheetAbi as Abi,
          selectedSheetAddress,
          starknetRpcProvider
        ) as SheetContract)
      : undefined;
  }, [selectedSheetAddress]);

  return { contract };
}
