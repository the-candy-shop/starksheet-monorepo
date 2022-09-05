import { useStarknet } from "@starknet-react/core";
import { useMemo } from "react";
import { Abi, Contract } from "starknet";
import starksheetContractData from "../contract.json";
import { starknetSequencerProvider } from "../provider";

export function useSheetListContract() {
  const { library } = useStarknet();

  const contract = useMemo(
    () =>
      new Contract(
        starksheetContractData.starkSheetAbi as Abi,
        starksheetContractData.address,
        // @ts-ignore
        library.address ? library : starknetSequencerProvider
      ),
    [library]
  );

  return { contract };
}
