import { useSheetListContract } from "./useSheetListContract";
import { toHex } from "starknet/utils/number";
import BN from "bn.js";
import { useContext, useEffect } from "react";
import { CurrentSheetContext } from "../contexts/CurrentSheetContext";

export function useSheetList() {
  const { contract } = useSheetListContract();
  const { addresses, setAddresses } = useContext(CurrentSheetContext);

  useEffect(() => {
    if (contract && addresses.length === 0) {
      contract.call("getSheets", []).then((sheetsData: any) => {
        const result = sheetsData?.addresses?.map((address: BN) =>
          toHex(address)
        );

        setAddresses(result);
      });
    }
  });

  return addresses;
}
