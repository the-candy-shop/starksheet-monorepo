import { useStarkSheetContract } from "./useStarkSheetContract";
import { useStarknet } from "@starknet-react/core";
import { useCallback, useContext, useMemo, useState } from "react";
import { CellValuesContext } from "../contexts/CellValuesContext";
import { toBN } from "starknet/utils/number";
import { useSnackbar } from "notistack";
import StarkSheetContract from "../contract.json";

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

  const waitForMint = useCallback(
    (id: number): Promise<void> => {
      if (contract && account) {
        return new Promise((resolve) => {
          setTimeout(async () => {
            try {
              const exists = await contract.call("ownerOf", [[id, "0"]]);

              if (exists) {
                resolve();
              } else {
                await waitForMint(id);
                resolve();
              }
            } catch {
              await waitForMint(id);
              resolve();
            }
          }, 5000);
        });
      } else {
        return Promise.resolve();
      }
    },
    [account, contract]
  );

  const mint = useCallback(
    async (id: number) => {
      if (!contract || !account) return;

      try {
        if (!addressProof) {
          throw new Error(`Address ${account} is not whitelisted`);
        }

        setLoading(true);
        const result = await contract.invoke("mintPublic", [
          [id, "0"],
          addressProof,
        ]);

        if (result.code && result.code.includes("StarknetErrorCode")) {
          // @ts-ignore
          console.error(result.message);
          // @ts-ignore
          throw new Error(result.message);
        }

        await waitForMint(id);
        updateValueOwner(id, toBN(account));
      } catch (e: any) {
        enqueueSnackbar(e.toString(), { variant: "error" });
      } finally {
        setLoading(false);
      }
    },
    [
      account,
      addressProof,
      contract,
      enqueueSnackbar,
      updateValueOwner,
      waitForMint,
    ]
  );

  return { mint, loading };
};
