import { Box, BoxProps } from "@mui/material";
import { getStarknet } from "get-starknet";
import { useSnackbar } from "notistack";
import { useCallback, useContext, useMemo, useState } from "react";
import { stark } from "starknet";
import { toBN } from "starknet/utils/number";
import { AccountContext } from "../../contexts/AccountContext";
import { CellValuesContext } from "../../contexts/CellValuesContext";
import { useSheetContract } from "../../hooks/useSheetContract";
import { starknetRpcProvider } from "../../provider";
import Tooltip from "../../Tooltip/Tooltip";
import { CellData } from "../../types";
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
  const { accountAddress, proof } = useContext(AccountContext);
  const { contract } = useSheetContract();
  const { updatedValues, setUpdatedValues } = useContext(CellValuesContext);
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState<boolean>(false);

  const onClick = useCallback(async () => {
    if (!contract) {
      return;
    }
    setLoading(true);

    const transactions = Object.entries(updatedValues)
      .filter(
        ([_, cell]) =>
          cell.owner.eq(toBN(0)) ||
          "0x" + cell.owner.toString(16) === accountAddress
      )
      .map(([tokenId, cell]) =>
        cell.owner.eq(toBN(0))
          ? {
              contractAddress: contract.address,
              entrypoint: "mintAndSetPublic",
              calldata: stark.compileCalldata({
                tokenId: {
                  type: "struct",
                  low: tokenId,
                  high: 0,
                },
                proof,
                contractAddress: cell.contractAddress.toString(),
                value: cell.selector.toString(),
                cellCalldata: cell.calldata.map((d) => d.toString()),
              }),
            }
          : {
              contractAddress: contract.address,
              entrypoint: "setCell",
              calldata: stark.compileCalldata({
                tokenId: tokenId,
                contractAddress: cell.contractAddress.toString(),
                value: cell.selector.toString(),
                cellCalldata: cell.calldata.map((d) => d.toString()),
              }),
            }
      );

    getStarknet()
      .account.execute(transactions)
      .then(async (response) => {
        await starknetRpcProvider.waitForTransaction(response.transaction_hash);
        return starknetRpcProvider.getTransactionReceipt(
          response.transaction_hash
        );
      })
      .then((receipt) => {
        if (receipt.status !== "REJECTED") {
          setUpdatedValues({});
        }
      })
      .catch((error: any) =>
        enqueueSnackbar(error.toString(), { variant: "error" })
      )
      .finally(() => setLoading(false));
  }, [
    contract,
    setUpdatedValues,
    updatedValues,
    enqueueSnackbar,
    accountAddress,
    proof,
  ]);

  const error = useMemo(
    () =>
      selectedCell
        ? getError(selectedCell.id, cellData, newDependencies)
        : null,
    [selectedCell, cellData, newDependencies]
  );

  if (
    selectedCell &&
    currentCellOwnerAddress &&
    currentCellOwnerAddress !== getStarknet().account.address &&
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
              backgroundColor: !!getStarknet().account.address
                ? "#FF4F0A"
                : undefined,
              boxShadow: !!getStarknet().account.address
                ? "inset -5px -5px 3px #FF8555, inset 5px 5px 3px #D9450B"
                : undefined,
              justifyContent: "center",
              textAlign: "center",
              color: !getStarknet().account.address ? "#8C95A3" : undefined,
            },
            ...sx,
          }}
          onClick={onClick}
          disabled={
            !getStarknet().account.address ||
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
