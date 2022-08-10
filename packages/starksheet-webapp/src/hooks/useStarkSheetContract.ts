import { Abi, Contract } from "starknet";
import StarkSheetContract from "../contract.json";
import { useContext, useMemo } from "react";
import { CurrentSheetContext } from "../contexts/CurrentSheetContext";
import { starknetProvider } from "../App";

export function useStarkSheetContract(address?: string) {
  const { currentSheetAddress } = useContext(CurrentSheetContext);
  const selectedAddress = address || currentSheetAddress;

  const contract = useMemo(
    () =>
      selectedAddress
        ? new Contract(
            StarkSheetContract.sheetAbi as Abi,
            selectedAddress,
            starknetProvider
          )
        : undefined,
    [selectedAddress]
  );

  return { contract };
}
