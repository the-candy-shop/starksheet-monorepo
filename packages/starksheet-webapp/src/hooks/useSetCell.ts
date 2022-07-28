import { useStarkSheetContract } from "./useStarkSheetContract";
import { useStarknet, useStarknetInvoke } from "@starknet-react/core";
import { useCallback, useContext, useEffect, useState } from "react";
import { CellValuesContext } from "../contexts/CellValuesContext";
import { BigNumberish } from "starknet/utils/number";
import { useSnackbar } from "notistack";
import {
  CellValue,
  operationNumbers,
} from "../components/ActionBar/formula.utils";
import StarkSheetContract from "../contract.json";

export const useSetCell = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { account } = useStarknet();
  const { contract } = useStarkSheetContract();
  const { refresh, cellNames } = useContext(CellValuesContext);
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
    (id: number, value: BigNumberish): Promise<void> => {
      if (contract && account) {
        return new Promise((resolve) => {
          setTimeout(async () => {
            try {
              const cell = await contract.call("getCell", [id]);

              if (cell && cell.value.toString() === value.toString()) {
                resolve();
              } else {
                await waitForTransaction(id, value);
                resolve();
              }
            } catch {
              await waitForTransaction(id, value);
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
    async (id: number, value: string, parsedValue: CellValue) => {
      if (!contract || !account) return;

      try {
        setLoading(true);

        if (parsedValue.type === "number") {
          await invoke({ args: [0, id, value, []] });
        } else if (parsedValue.type === "formula") {
          await invoke({
            args: [
              StarkSheetContract.mathAddress,
              id,
              // @ts-ignore
              operationNumbers[parsedValue.operation],
              // @ts-ignore
              parsedValue.dependencies.map((dep) => cellNames.indexOf(dep)),
            ],
          });
        }

        await waitForTransaction(id, value);
        await refresh();
      } catch (e) {
        console.log("e", e);
      } finally {
        setLoading(false);
      }
    },
    [account, cellNames, contract, invoke, refresh, waitForTransaction]
  );

  return { setCell, loading };
};
