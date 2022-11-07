import { Box, BoxProps } from "@mui/material";
import { getStarknet } from "get-starknet";
import { useCallback, useContext, useState } from "react";
import { AccountContext } from "../../contexts/AccountContext";
import { TransactionsContext } from "../../contexts/TransactionsContext";
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
  const { transactions, settleTransactions } = useContext(TransactionsContext);
  const { accountAddress } = useContext(AccountContext);
  const [loading, setLoading] = useState<boolean>(false);

  const onClick = useCallback(async () => {
    if (transactions.length === 0) {
      return;
    }
    setLoading(true);
    settleTransactions().then(() => setLoading(false));
  }, [settleTransactions, transactions]);

  if (
    currentCellOwnerAddress !== undefined &&
    "0x" + currentCellOwnerAddress !== accountAddress &&
    currentCellOwnerAddress !== "0"
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
        Owned by {"0x" + currentCellOwnerAddress.substring(0, 8)}
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
              backgroundColor: !!getStarknet().account?.address
                ? "#FF4F0A"
                : undefined,
              boxShadow: !!getStarknet().account?.address
                ? "inset -5px -5px 3px #FF8555, inset 5px 5px 3px #D9450B"
                : undefined,
              justifyContent: "center",
              textAlign: "center",
              color: !getStarknet().account?.address ? "#8C95A3" : undefined,
            },
            ...sx,
          }}
          onClick={onClick}
          disabled={!getStarknet().account?.address || loading || !!error}
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
