import { useContract } from "@starknet-react/core";
import { Abi } from "starknet";

import StarkSheetContract from "../contract.json";

export function useStarkSheetContract() {
  return useContract({
    abi: StarkSheetContract.abi as Abi,
    address: StarkSheetContract.address,
  });
}
