import { useContract, useStarknetCall } from "@starknet-react/core";
import { Abi } from "starknet";

import StarkSheetContract from "../contract.json";
import { toHex } from "starknet/utils/number";

export function useStarkSheetContract() {
  const { contract } = useContract({
    abi: StarkSheetContract.starkSheetAbi as Abi,
    address: StarkSheetContract.address,
  });

  const { data: sheetsData } = useStarknetCall({
    contract,
    method: "getSheets",
    args: [],
  });

  console.log("sheetsData", sheetsData);

  return useContract({
    abi: StarkSheetContract.sheetAbi as Abi,
    // @ts-ignore
    address: sheetsData ? toHex(sheetsData.addresses[0]) : "",
  });
}
