import { Box, BoxProps } from "@mui/material";
import { useStarknet } from "@starknet-react/core";
import { useSnackbar } from "notistack";
import { useCallback, useContext, useMemo, useState } from "react";
import { CellData, CellValuesContext } from "../../contexts/CellValuesContext";
import starksheetContractData from "../../contract.json";
import { useSheetContract } from "../../hooks/useSheetContract";
import { starknetRpcProvider } from "../../provider";
import Tooltip from "../../Tooltip/Tooltip";
import { getError } from "../ActionBar/formula.utils";
import Button from "../Button/Button";
import Cell from "../Cell/Cell";
import LoadingDots from "../LoadingDots/LoadingDots";

export type SaveButtonProps = {
  cellData: CellData | null;
  newDependencies: number[];
  selectedCell: { name: string; id: number } | null;
  currentCellOwnerAddress?: string;
  disabled?: boolean;
  sx?: BoxProps["sx"];
};

function SaveButton({
  cellData,
  newDependencies,
  selectedCell,
  currentCellOwnerAddress,
  disabled,
  sx,
}: SaveButtonProps) {
  const { account } = useStarknet();
  const { contract } = useSheetContract();
  const { updatedValues, setUpdatedValues } = useContext(CellValuesContext);
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState<boolean>(false);

  const addressProof = useMemo(
    // @ts-ignore
    () => starksheetContractData.allowlist[account] || [],
    [account]
  );

  const onClick = useCallback(() => {
    if (!contract) {
      return;
    }
    setLoading(true);
    Promise.all(
      Object.entries(updatedValues).map(([tokenId, cell]) => {
        if ("0x" + cell.owner.toString(16) !== account) {
          return contract.invoke("mintAndSetPublic", [
            [tokenId, "0"],
            addressProof,
            cell.contractAddress,
            cell.selector,
            cell.calldata,
          ]);
        }
        return contract.invoke("setCell", [
          tokenId,
          cell.contractAddress,
          cell.selector,
          cell.calldata,
        ]);
      })
    )
      .then((txs) => {
        return Promise.all(
          txs.map(async (tx) => {
            await starknetRpcProvider.waitForTransaction(tx.transaction_hash);
            return starknetRpcProvider.getTransactionReceipt(
              tx.transaction_hash
            );
          })
        );
      })
      .then((receipts) => {
        const success = receipts
          .map((receipt, index) => ({ ...receipt, index }))
          .filter((receipt) => receipt.status !== "REJECTED")
          .map((receipt) => receipt.index);
        setUpdatedValues(
          Object.fromEntries(
            Object.entries(updatedValues).filter(
              ([key]) => !success.includes(parseInt(key))
            )
          )
        );
      })
      .catch((error: any) =>
        enqueueSnackbar(error.toString(), { variant: "error" })
      )
      .finally(() => setLoading(false));
  }, [
    account,
    addressProof,
    contract,
    setUpdatedValues,
    updatedValues,
    enqueueSnackbar,
  ]);

  const error = useMemo(
    () =>
      selectedCell
        ? getError(selectedCell.id, cellData, newDependencies)
        : null,
    [selectedCell, cellData, newDependencies]
  );
  const noAccount = useMemo(() => !account, [account]);

  if (
    selectedCell &&
    currentCellOwnerAddress &&
    currentCellOwnerAddress !== account &&
    currentCellOwnerAddress !== "0x0"
  ) {
    return (
      <Cell
        sx={{
          width: "291px",
          "& .content": {
            textAlign: "center",
          },
          ...sx,
        }}
      >
        Owned by {currentCellOwnerAddress.substring(0, 8)}
      </Cell>
    );
  }

  return (
    <Tooltip title={error ? error : false} followCursor>
      <span>
        <Button
          sx={{
            width: "221px",
            "& .content": {
              backgroundColor: !noAccount ? "#FF4F0A" : undefined,
              boxShadow: !noAccount
                ? "inset -5px -5px 3px #FF8555, inset 5px 5px 3px #D9450B"
                : undefined,
              justifyContent: "center",
              textAlign: "center",
              color: noAccount ? "#8C95A3" : undefined,
            },
            ...sx,
          }}
          onClick={onClick}
          disabled={
            noAccount ||
            loading ||
            !!error ||
            disabled ||
            Object.keys(updatedValues).length === 0
          }
        >
          {loading && (
            <Box>
              Saving
              <LoadingDots />
            </Box>
          )}
          {!loading && `Save`}
        </Button>
      </span>
    </Tooltip>
  );
}

export default SaveButton;
