import { Box, BoxProps } from "@mui/material";
import { getStarknet } from "get-starknet";
import { useSnackbar } from "notistack";
import { useCallback, useContext, useMemo, useState } from "react";
import { stark } from "starknet";
import { toBN } from "starknet/utils/number";
import { AccountContext } from "../../contexts/AccountContext";
import { CellValuesContext } from "../../contexts/CellValuesContext";
import { starknetRpcProvider } from "../../provider";
import Tooltip from "../../Tooltip/Tooltip";
import Button from "../Button/Button";
import Cell from "../Cell/Cell";
import LoadingDots from "../LoadingDots/LoadingDots";

export type SaveButtonProps = {
  currentCellOwnerAddress?: string;
  error?: string;
  sx?: BoxProps["sx"];
};

function SaveButton({ currentCellOwnerAddress, error, sx }: SaveButtonProps) {
  const { accountAddress, proof } = useContext(AccountContext);
  const { updatedValues, setUpdatedValues } = useContext(CellValuesContext);
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState<boolean>(false);

  const transactions = useMemo(() => {
    return Object.entries(updatedValues)
      .map(([sheetAddress, sheetUpdatedValues]) => {
        return Object.entries(sheetUpdatedValues).map(([tokenId, cell]) => ({
          ...cell,
          tokenId,
          sheetAddress,
        }));
      })
      .reduce((prev, cur) => [...prev, ...cur], [])
      .filter(
        (cell) =>
          cell.owner.eq(toBN(0)) ||
          "0x" + cell.owner.toString(16) === accountAddress
      )
      .map((cell) =>
        cell.owner.eq(toBN(0))
          ? {
              contractAddress: cell.sheetAddress,
              entrypoint: "mintAndSetPublic",
              calldata: stark.compileCalldata({
                tokenId: {
                  type: "struct",
                  low: cell.tokenId,
                  high: 0,
                },
                proof,
                contractAddress: cell.contractAddress.toString(),
                value: cell.selector.toString(),
                cellCalldata: cell.calldata.map((d) => d.toString()),
              }),
            }
          : {
              contractAddress: cell.sheetAddress,
              entrypoint: "setCell",
              calldata: stark.compileCalldata({
                tokenId: cell.tokenId,
                contractAddress: cell.contractAddress.toString(),
                value: cell.selector.toString(),
                cellCalldata: cell.calldata.map((d) => d.toString()),
              }),
            }
      );
  }, [accountAddress, proof, updatedValues]);

  const onClick = useCallback(async () => {
    if (transactions.length === 0) {
      return;
    }
    setLoading(true);
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
  }, [setUpdatedValues, enqueueSnackbar, transactions]);

  if (
    currentCellOwnerAddress &&
    currentCellOwnerAddress !== accountAddress &&
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
            !getStarknet().account.address || loading || !!error
            // transactions.length === 0
          }
        >
          {loading ? (
            <Box>
              Saving
              <LoadingDots />
            </Box>
          ) : (
            `Save`
          )}
        </Button>
      </span>
    </Tooltip>
  );
}

export default SaveButton;
