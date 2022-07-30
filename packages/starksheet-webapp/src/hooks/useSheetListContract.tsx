import { useContract } from "@starknet-react/core";
import StarkSheetContract from "../contract.json";
import { Abi } from "starknet";

export function useSheetListContract() {
  return useContract({
    abi: StarkSheetContract.starkSheetAbi as Abi,
    address: StarkSheetContract.address,
  });
}
