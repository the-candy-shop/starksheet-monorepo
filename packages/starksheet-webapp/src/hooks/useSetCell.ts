import { useStarknet } from "@starknet-react/core";
import { useSnackbar } from "notistack";
import { useCallback, useContext, useState } from "react";
import { CellData } from "../components/ActionBar/formula.utils";
import { CellValuesContext } from "../contexts/CellValuesContext";
import { starknetRpcProvider } from "../provider";
import { useStarkSheetContract } from "./useStarkSheetContract";

export const useSetCell = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { account } = useStarknet();
  const { contract } = useStarkSheetContract();
  const { refresh } = useContext(CellValuesContext);
  const [loading, setLoading] = useState<boolean>(false);

  const setCell = useCallback(
    async (id: number, cellData: CellData) => {
      if (!contract || !account) return;

      try {
        setLoading(true);

        const response = await contract.invoke("setCell", [
          id,
          cellData.contractAddress,
          cellData.value,
          cellData.calldata,
        ]);
        console.log("setCell tx", response);
        await starknetRpcProvider.waitForTransaction(response.transaction_hash);
        const receipt = await starknetRpcProvider.getTransactionReceipt(
          response.transaction_hash
        );
        if (receipt.status === "REJECTED") {
          enqueueSnackbar(
            `setCell ${receipt.status}; status_data:${receipt.status_data}`,
            { variant: "error" }
          );
        }

        refresh();
      } catch (error: any) {
        console.log("e", error);
      } finally {
        setLoading(false);
      }
    },
    [account, contract, refresh, enqueueSnackbar]
  );

  return { setCell, loading };
};
