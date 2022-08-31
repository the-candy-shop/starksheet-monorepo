import { useStarknet } from "@starknet-react/core";
import { useSnackbar } from "notistack";
import { useCallback, useContext, useMemo, useState } from "react";
import { toBN } from "starknet/utils/number";
import { CellValuesContext } from "../contexts/CellValuesContext";
import StarkSheetContract from "../contract.json";
import { starknetRpcProvider } from "../provider";
import { useStarkSheetContract } from "./useStarkSheetContract";

export const useMint = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { account } = useStarknet();
  const { contract } = useStarkSheetContract();
  const { updateValueOwner } = useContext(CellValuesContext);
  const [loading, setLoading] = useState<boolean>(false);

  const addressProof = useMemo(
    // @ts-ignore
    () => (account ? StarkSheetContract.allowlist[account] : undefined),
    [account]
  );

  const mint = useCallback(
    async (id: number) => {
      if (!contract || !account) return;

      try {
        if (!addressProof) {
          throw new Error(`Address ${account} is not whitelisted`);
        }

        setLoading(true);
        const response = await contract.invoke("mintPublic", [
          [id, "0"],
          addressProof,
        ]);
        await starknetRpcProvider.waitForTransaction(response.transaction_hash);
        const receipt = await starknetRpcProvider.getTransactionReceipt(
          response.transaction_hash
        );

        if (receipt.status === "REJECTED") {
          throw new Error(
            `Transacation ${receipt.status}; status_data:${receipt.status_data}`
          );
        }

        updateValueOwner(id, toBN(account));
      } catch (e: any) {
        enqueueSnackbar(e.toString(), { variant: "error" });
      } finally {
        setLoading(false);
      }
    },
    [account, addressProof, contract, enqueueSnackbar, updateValueOwner]
  );

  return { mint, loading };
};
