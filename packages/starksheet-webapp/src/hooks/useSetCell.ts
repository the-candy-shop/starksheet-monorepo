import { useStarknet, useStarknetInvoke } from "@starknet-react/core";
import BN from "bn.js";
import { useSnackbar } from "notistack";
import { useCallback, useContext, useEffect, useState } from "react";
import { toBN } from "starknet/utils/number";
import { CellData } from "../components/ActionBar/formula.utils";
import { CellValuesContext } from "../contexts/CellValuesContext";
import { useStarkSheetContract } from "./useStarkSheetContract";

export const useSetCell = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { account } = useStarknet();
  const { contract } = useStarkSheetContract();
  const { refresh } = useContext(CellValuesContext);
  const [loading, setLoading] = useState<boolean>(false);
  const { invoke, error, reset } = useStarknetInvoke({
    contract,
    method: "setCell",
  });

  useEffect(() => {
    if (error) {
      setLoading(false);
      enqueueSnackbar(error, { variant: "error" });
      reset();
    }
  }, [enqueueSnackbar, error, reset]);

  const waitForTransaction = useCallback(
    (id: number, value: BN, cell_calldata: BN[]): Promise<void> => {
      if (contract && account) {
        return new Promise((resolve) => {
          setTimeout(async () => {
            try {
              const cell = await contract.call("getCell", [id]);

              if (
                cell &&
                cell.value.toString() === value.toString() &&
                JSON.stringify(cell.cell_calldata) ===
                  JSON.stringify(cell_calldata)
              ) {
                resolve();
              } else {
                await waitForTransaction(id, value, cell_calldata);
                resolve();
              }
            } catch (e) {
              console.error(e);
              await waitForTransaction(id, value, cell_calldata);
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

  const setCell = useCallback(
    async (id: number, cellData: CellData) => {
      if (!contract || !account) return;

      try {
        setLoading(true);

        await invoke({
          args: [
            id,
            cellData.contractAddress,
            cellData.value,
            cellData.calldata,
          ],
        });
        await waitForTransaction(id, toBN(cellData.value), cellData.calldata);

        refresh();
      } catch (e) {
        console.log("e", e);
      } finally {
        setLoading(false);
      }
    },
    [account, contract, invoke, refresh, waitForTransaction]
  );

  return { setCell, loading };
};
