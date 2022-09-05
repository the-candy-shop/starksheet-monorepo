import BN from "bn.js";
import { useContext, useEffect } from "react";
import { toHex } from "starknet/utils/number";
import { CurrentSheetContext } from "../contexts/CurrentSheetContext";
import { useSheetListContract } from "./useSheetListContract";

export function useSheetList() {
  const { contract } = useSheetListContract();
  const { addresses, setAddresses } = useContext(CurrentSheetContext);

  const updateAddresses = async () => {
    const sheetsData = await contract.call("getSheets", []);
    const result = sheetsData?.addresses?.map((address: BN) => toHex(address));
    setAddresses(result);
    return result;
  };

  useEffect(() => {
    if (contract && addresses.length === 0) {
      updateAddresses();
    }
  });

  return { addresses, updateAddresses };
}
