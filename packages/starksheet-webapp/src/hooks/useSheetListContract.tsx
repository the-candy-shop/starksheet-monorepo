import StarkSheetContract from "../contract.json";
import { Abi, Contract } from "starknet";
import { useMemo } from "react";
import { starknetProvider } from "../App";
import { useStarknet } from "@starknet-react/core";

export function useSheetListContract() {
  const { library } = useStarknet();

  const contract = useMemo(
    () =>
      new Contract(
        StarkSheetContract.starkSheetAbi as Abi,
        StarkSheetContract.address,
        // @ts-ignore
        library.address ? library : starknetProvider
      ),
    [library]
  );

  return { contract };
}
