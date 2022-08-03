import { useStarkSheetContract } from "./useStarkSheetContract";
import { useStarknet, useStarknetInvoke } from "@starknet-react/core";
import { useCallback, useContext, useEffect, useState } from "react";
import { CellValuesContext } from "../contexts/CellValuesContext";
import { useSnackbar } from "notistack";
import {
  CellValue,
  operationNumbers,
} from "../components/ActionBar/formula.utils";
import StarkSheetContract from "../contract.json";
import BN from "bn.js";
import { toBN } from "starknet/utils/number";

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
    async (id: number, value: string, parsedValue: CellValue) => {
      if (!contract || !account) return;

      try {
        setLoading(true);

        if (parsedValue.type === "number") {
          await invoke({ args: [id, 0, value, []] });
          await waitForTransaction(id, toBN(value), []);
        } else if (parsedValue.type === "formula") {
          // @ts-ignore
          const operationValue = operationNumbers[parsedValue.operation];
          // @ts-ignore
          const dependencies = parsedValue.dependencies.map((dep) =>
            toBN(cellNames.indexOf(dep))
          );
          const cell_calldata = [
            toBN(dependencies.length * 2),
            ...dependencies.map((dep) => dep.mul(toBN(2)).add(toBN(1))),
          ];
          await invoke({
            args: [
              id,
              StarkSheetContract.mathAddress,
              operationValue,
              cell_calldata,
            ],
          });
          await waitForTransaction(id, operationValue, cell_calldata);
        }

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
