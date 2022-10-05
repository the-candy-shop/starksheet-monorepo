import { useContext, useMemo } from "react";
import { Abi, Contract } from "starknet";
import { StarksheetContext } from "../contexts/StarksheetContext";
import starksheetContractData from "../contract.json";
import { starknetSequencerProvider } from "../provider";

export function useStarksheetContract() {
  const { starksheet } = useContext(StarksheetContext);
  const contract = useMemo(
    () =>
      new Contract(
        starksheetContractData.starkSheetAbi as Abi,
        starksheet.address,
        starknetSequencerProvider
      ),
    []
  );

  return { contract };
}
