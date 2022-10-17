import { useContext, useMemo } from "react";
import { Abi, Contract } from "starknet";
import { StarksheetContext } from "../contexts/StarksheetContext";
import starksheetContractData from "../contract.json";
import { starknetSequencerProvider } from "../provider";
import { StarksheetContract } from "../types";

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
      ) as StarksheetContract,
    [address]
  );

  return { contract };
}
