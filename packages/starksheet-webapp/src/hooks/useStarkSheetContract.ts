import { useContract } from "@starknet-react/core";
import { Abi } from "starknet";

import StarkSheet from "../Starksheet.json";

export function useStarkSheetContract() {
  return useContract({
    abi: StarkSheet as Abi,
    address:
      "0x0484b02effc147cde6df48e331a873f5101b07eab273ba79387ed4abe76317fe",
  });
}
