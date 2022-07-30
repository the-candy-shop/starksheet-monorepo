import { useContract } from "@starknet-react/core";
import { Abi } from "starknet";
import StarkSheetContract from "../contract.json";
import { useContext } from "react";
import { CurrentSheetContext } from "../contexts/CurrentSheetContext";

export function useStarkSheetContract(address?: string) {
  const { currentSheetAddress } = useContext(CurrentSheetContext);
  const selectedAddress = address || currentSheetAddress;

  return useContract({
    abi: StarkSheetContract.sheetAbi as Abi,
    address: selectedAddress ? selectedAddress : "",
  });
}
