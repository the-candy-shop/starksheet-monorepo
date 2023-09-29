import { useContext, useMemo } from "react";
import { OnsheetContext } from "../contexts/OnsheetContext";
import { useChainProvider } from "./useChainProvider";

export function useSheetContract(address?: string) {
  const { selectedSheetAddress } = useContext(OnsheetContext);
  const chainProvider = useChainProvider();

  const sheetAddress = address || selectedSheetAddress;
  const contract = useMemo(() => {
    if (!sheetAddress) {
      return undefined;
    }

    return chainProvider.getWorksheetContractByAddress(sheetAddress);
  }, [chainProvider, sheetAddress]);

  return { contract };
}
