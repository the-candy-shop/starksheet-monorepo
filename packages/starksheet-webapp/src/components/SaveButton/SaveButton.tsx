import { Box, BoxProps } from "@mui/material";
import { useCallback, useContext, useMemo, useState } from "react";
import Tooltip from "../../Tooltip/Tooltip";
import { AccountContext } from "../../contexts/AccountContext";
import { TransactionsContext } from "../../contexts/TransactionsContext";
import Button from "../Button/Button";
import Cell from "../Cell/Cell";
import LoadingDots from "../LoadingDots/LoadingDots";

export type SaveButtonProps = {
  currentCellOwnerAddress?: string;
  error?: string;
  sx?: BoxProps["sx"];
};

function SaveButton({ currentCellOwnerAddress, error, sx }: SaveButtonProps) {
  const { transactions, settleTransactions, costEth } =
    useContext(TransactionsContext);
  const { accountAddress } = useContext(AccountContext);
  const [loading, setLoading] = useState<boolean>(false);

  const cost = useMemo(() => (costEth > 0 ? ` (${costEth})` : ""), [costEth]);

  const onClick = useCallback(async () => {
    if (transactions.length === 0) {
      return;
    }
    setLoading(true);
    await settleTransactions();
    setLoading(false);
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
              backgroundColor: !!accountAddress ? "#FF4F0A" : undefined,
              boxShadow: !!accountAddress
                ? "inset -5px -5px 3px #FF8555, inset 5px 5px 3px #D9450B"
                : undefined,
              justifyContent: "center",
              textAlign: "center",
              color: !accountAddress ? "#8C95A3" : undefined,
            },
            ...sx,
          }}
          onClick={onClick}
          disabled={!accountAddress || loading || !!error}
        >
          {loading ? (
            <Box>
              Saving
              <LoadingDots />
            </Box>
          ) : (
            `Save${cost}`
          )}
        </Button>
      </span>
    </Tooltip>
  );
}

export default SaveButton;
