import { useStarknet } from "@starknet-react/core";
import { useMemo } from "react";
import { Abi, Contract } from "starknet";
import StarkSheetContract from "../contract.json";
import { starknetSequencerProvider } from "../provider";

export function useSheetListContract() {
  const { library } = useStarknet();

  const contract = useMemo(
    () =>
      new Contract(
        StarkSheetContract.starkSheetAbi as Abi,
        StarkSheetContract.address,
        // @ts-ignore
        library.address ? library : starknetSequencerProvider
      ),
    [library]
  );

  return { contract };
}
