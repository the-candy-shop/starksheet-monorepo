import { useStarkSheetContract } from "./useStarkSheetContract";
import { useStarknet, useStarknetInvoke } from "@starknet-react/core";
import { useCallback, useContext, useState } from "react";
import { CellValuesContext } from "../contexts/CellValuesContext";
import { toBN } from "starknet/utils/number";

export const useMint = () => {
  const { account } = useStarknet();
  const { contract } = useStarkSheetContract();
  const { updateValueOwner } = useContext(CellValuesContext);
  const [loading, setLoading] = useState<boolean>(false);
  const { invoke } = useStarknetInvoke({
    contract,
    method: "mintPublic",
  });

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

      setLoading(true);
      await invoke({ args: [[id, "0"]] });

      await waitForMint(id);
      updateValueOwner(id, toBN(account));
      setLoading(false);
    },
    [account, contract, invoke, updateValueOwner, waitForMint]
  );

  return { mint, loading };
};
