import { useSheetListContract } from "./useSheetListContract";
import { useStarknetCall } from "@starknet-react/core";
import { toHex } from "starknet/utils/number";
import BN from "bn.js";

export function useSheetList() {
  const { contract } = useSheetListContract();

  const { data: sheetsData } = useStarknetCall({
    contract,
    method: "getSheets",
    args: [],
  }) as unknown as { data: { addresses: BN[] } };

  return sheetsData?.addresses?.map((address) => toHex(address));
}
