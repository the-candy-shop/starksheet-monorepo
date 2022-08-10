import { Abi, Contract } from "starknet";
import StarkSheetContract from "../contract.json";
import { useContext, useMemo } from "react";
import { CurrentSheetContext } from "../contexts/CurrentSheetContext";
import { starknetProvider } from "../App";
import { useStarknet } from "@starknet-react/core";

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
