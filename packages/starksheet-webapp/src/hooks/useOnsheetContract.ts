import { useMemo } from "react";
import { useChainProvider } from "./useChainProvider";

export function useOnsheetContract() {
  const chainProvider = useChainProvider();

  const contract = useMemo(
    () => chainProvider.getSpreadsheetContract(),
    [chainProvider],
  );

  return { contract };
}
