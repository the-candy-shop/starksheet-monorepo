import { useStarkSheetContract } from "./useStarkSheetContract";
import { useStarknet, useStarknetInvoke } from "@starknet-react/core";
import { useCallback, useContext, useEffect, useState } from "react";
import { CellValuesContext } from "../contexts/CellValuesContext";
import { toBN } from "starknet/utils/number";
import { useSnackbar } from "notistack";

export const useMint = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { account } = useStarknet();
  const { contract } = useStarkSheetContract();
  const { updateValueOwner } = useContext(CellValuesContext);
  const [loading, setLoading] = useState<boolean>(false);
  const { invoke, error, reset } = useStarknetInvoke({
    contract,
    method: "mintPublic",
  });

  useEffect(() => {
    if (error) {
      setLoading(false);
      enqueueSnackbar(error, { variant: "error" });
      reset();
    }
  }, [enqueueSnackbar, error, reset]);

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
        setLoading(true);
        const result = await invoke({ args: [[id, "0"]] });

        if (result) {
          await waitForMint(id);
          updateValueOwner(id, toBN(account));
        }
      } catch (e: any) {
        enqueueSnackbar(e.toString(), { variant: "error" });
      } finally {
        setLoading(false);
      }
    },
    [account, contract, enqueueSnackbar, invoke, updateValueOwner, waitForMint]
  );

  return { mint, loading };
};
