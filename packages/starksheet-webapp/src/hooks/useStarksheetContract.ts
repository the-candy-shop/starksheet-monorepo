import { useContext, useMemo } from "react";
import { Abi, Contract } from "starknet";
import { StarksheetContext } from "../contexts/StarksheetContext";
import starksheetContractData from "../contract.json";
import { starknetSequencerProvider } from "../provider";

export function useStarksheetContract() {
  const {
    starksheet: { address },
  } = useContext(StarksheetContext);
  const contract = useMemo(
    () =>
      new Contract(
        starksheetContractData.starkSheetAbi as Abi,
        address,
        starknetSequencerProvider
      ),
    [address]
  );

  return { contract };
}
