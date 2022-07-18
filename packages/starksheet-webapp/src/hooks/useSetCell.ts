import { useStarkSheetContract } from "./useStarkSheetContract";
import { useStarknet, useStarknetInvoke } from "@starknet-react/core";
import { useCallback, useContext, useState } from "react";
import { CellValuesContext } from "../contexts/CellValuesContext";
import { BigNumberish } from "starknet/utils/number";

export const useSetCell = () => {
  const { account } = useStarknet();
  const { contract } = useStarkSheetContract();
  const { updateValue, refresh } = useContext(CellValuesContext);
  const [loading, setLoading] = useState<boolean>(false);
  const { invoke } = useStarknetInvoke({
    contract,
    method: "setCell",
  });

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
    async (
      id: number,
      value: BigNumberish,
      dependencies: BigNumberish[] = []
    ) => {
      if (!contract || !account) return;

      try {
        setLoading(true);
        await invoke({ args: [id, value, dependencies] });

        await waitForTransaction(id, value);
        // const render = await contract.call("renderCell", [id]);
        // updateValue(id, render.cell.value);
        await refresh();
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
