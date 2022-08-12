import { Box, BoxProps } from "@mui/material";
import { useStarknet } from "@starknet-react/core";
import { useCallback, useMemo } from "react";
import { useMint } from "../../hooks/useMint";
import { useSetCell } from "../../hooks/useSetCell";
import Tooltip from "../../Tooltip/Tooltip";
import { getError, parse } from "../ActionBar/formula.utils";
import Button from "../Button/Button";
import Cell from "../Cell/Cell";
import LoadingDots from "../LoadingDots/LoadingDots";

export type SaveButtonProps = {
  unSavedValue: string;
  newDependencies: string[];
  selectedCell: { name: string; id: number } | null;
  currentCellOwnerAddress?: string;
  sx?: BoxProps["sx"];
};

function SaveButton({
  unSavedValue,
  newDependencies,
  selectedCell,
  currentCellOwnerAddress,
  sx,
}: SaveButtonProps) {
  const { account } = useStarknet();
  const { mint, loading: loadingMint } = useMint();
  const { setCell, loading: loadingSetCell } = useSetCell();

  const onClick = useCallback(() => {
    if (!selectedCell) return;

    if (!currentCellOwnerAddress) {
      return mint(selectedCell.id);
    }

    if (!!account && currentCellOwnerAddress === account) {
      const parsedValue = parse(unSavedValue);

      if (!parsedValue) return;

      return setCell(selectedCell.id, unSavedValue, parsedValue);
    }
  }, [
    account,
    currentCellOwnerAddress,
    mint,
    selectedCell,
    setCell,
    unSavedValue,
  ]);

  const error = useMemo(
    () =>
      selectedCell
        ? getError(selectedCell.name, unSavedValue, newDependencies)
        : null,
    [selectedCell, unSavedValue, newDependencies]
  );
  const disabled = useMemo(() => !account, [account]);

  if (
    selectedCell &&
    currentCellOwnerAddress &&
    currentCellOwnerAddress !== account
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
              backgroundColor: !disabled ? "#FF4F0A" : undefined,
              boxShadow: !disabled
                ? "inset -5px -5px 3px #FF8555, inset 5px 5px 3px #D9450B"
                : undefined,
              justifyContent: "center",
              textAlign: "center",
              color: disabled ? "#8C95A3" : undefined,
            },
            ...sx,
          }}
          onClick={onClick}
          disabled={disabled || loadingMint || loadingSetCell || !!error}
        >
          {loadingMint && (
            <Box>
              MINTING
              <LoadingDots />
            </Box>
          )}
          {loadingSetCell && (
            <Box>
              Saving value
              <LoadingDots />
            </Box>
          )}
          {!loadingMint &&
            !loadingSetCell &&
            (currentCellOwnerAddress ? "Save Value" : "MINT ACCESS")}
        </Button>
      </span>
    </Tooltip>
  );
}

export default SaveButton;
