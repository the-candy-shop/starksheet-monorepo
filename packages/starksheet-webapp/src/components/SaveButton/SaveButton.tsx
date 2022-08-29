import { Box, BoxProps } from "@mui/material";
import { useStarknet } from "@starknet-react/core";
import { useCallback, useMemo } from "react";
import { useMint } from "../../hooks/useMint";
import { useSetCell } from "../../hooks/useSetCell";
import Tooltip from "../../Tooltip/Tooltip";
import { CellData, getError } from "../ActionBar/formula.utils";
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
  const { mint, loading: loadingMint } = useMint();
  const { setCell, loading: loadingSetCell } = useSetCell();

  const onClick = useCallback(() => {
    if (!selectedCell) return;

    if (!currentCellOwnerAddress) {
      return mint(selectedCell.id);
    }

    if (!!account && currentCellOwnerAddress === account) {
      if (!cellData) return;

      return setCell(selectedCell.id, cellData);
    }
  }, [account, currentCellOwnerAddress, mint, selectedCell, setCell, cellData]);

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
            noAccount || loadingMint || loadingSetCell || !!error || disabled
          }
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
