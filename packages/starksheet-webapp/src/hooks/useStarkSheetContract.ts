import { useStarknet } from "@starknet-react/core";
import { useContext, useMemo } from "react";
import { Abi, Contract } from "starknet";
import { CurrentSheetContext } from "../contexts/CurrentSheetContext";
import StarkSheetContract from "../contract.json";
import { starknetProvider } from "../provider";

export function useStarkSheetContract(address?: string) {
  const { currentSheetAddress } = useContext(CurrentSheetContext);
  const selectedAddress = address || currentSheetAddress;
  const { library } = useStarknet();

  const contract = useMemo(
    () =>
      selectedAddress
        ? new Contract(
            StarkSheetContract.sheetAbi as Abi,
            selectedAddress,
            // @ts-ignore
            library.address ? library : starknetProvider
          )
        : undefined,
    [selectedAddress, library]
  );

  return { contract };
}
