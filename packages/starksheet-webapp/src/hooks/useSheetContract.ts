import { useStarknet } from "@starknet-react/core";
import { useContext, useMemo } from "react";
import { Abi, Contract } from "starknet";
import { CurrentSheetContext } from "../contexts/CurrentSheetContext";
import starksheetContractData from "../contract.json";
import { starknetSequencerProvider } from "../provider";

export function useSheetContract(address?: string) {
  const { currentSheetAddress } = useContext(CurrentSheetContext);
  const selectedAddress = address || currentSheetAddress;
  const { library } = useStarknet();

  const contract = useMemo(
    () =>
      selectedAddress
        ? new Contract(
            starksheetContractData.sheetAbi as Abi,
            selectedAddress,
            // @ts-ignore
            library.address ? library : starknetSequencerProvider
          )
        : undefined,
    [selectedAddress, library]
  );

  return { contract };
}
