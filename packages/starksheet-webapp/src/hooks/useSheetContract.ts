import { useContext, useMemo } from "react";
import { Abi, Contract } from "starknet";
import { StarksheetContext } from "../contexts/StarksheetContext";
import starksheetContractData from "../contract.json";
import { starknetSequencerProvider } from "../provider";

export function useSheetContract() {
  const { starksheet, selectedSheet } = useContext(StarksheetContext);

  const contract = useMemo(() => {
    const contractAddress =
      selectedSheet !== undefined
        ? starksheet.sheets[selectedSheet].address
        : undefined;
    return contractAddress
      ? new Contract(
          starksheetContractData.sheetAbi as Abi,
          contractAddress,
          starknetSequencerProvider
        )
      : undefined;
  }, [starksheet, selectedSheet]);

  return { contract };
}
