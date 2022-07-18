import React, { useCallback, useContext, useMemo } from "react";
import { Box, BoxProps } from "@mui/material";
import Button from "../Button/Button";
import { useStarknet } from "@starknet-react/core";
import Cell from "../Cell/Cell";
import { useMint } from "../../hooks/useMint";
import { useSetCell } from "../../hooks/useSetCell";
import { getError, operationNumbers, parse } from "../ActionBar/formula.utils";
import { CellValuesContext } from "../../contexts/CellValuesContext";
import LoadingDots from "../LoadingDots/LoadingDots";
import Tooltip from "../../Tooltip/Tooltip";

export type SaveButtonProps = {
  unSavedValue: string;
  selectedCell: { name: string; id: number } | null;
  currentCellOwnerAddress?: string;
  sx?: BoxProps["sx"];
};

function SaveButton({
  unSavedValue,
  selectedCell,
  currentCellOwnerAddress,
  sx,
}: SaveButtonProps) {
  const { account } = useStarknet();
  const { mint, loading: loadingMint } = useMint();
  const { setCell, loading: loadingSetCell } = useSetCell();
  const { cellNames } = useContext(CellValuesContext);

  const onClick = useCallback(() => {
    if (!selectedCell) return;

    if (!currentCellOwnerAddress) {
      return mint(selectedCell.id);
    }

    if (!!account && currentCellOwnerAddress === account) {
      const parsedValue = parse(selectedCell.name, unSavedValue);

      if (!parsedValue) return;

      if (parsedValue.type === "number") {
        return setCell(selectedCell.id, unSavedValue);
      } else if (parsedValue.type === "formula") {
        return setCell(
          selectedCell.id,
          // @ts-ignore
          operationNumbers[parsedValue.operation],
          // @ts-ignore
          parsedValue.dependencies.map((dep) => cellNames.indexOf(dep))
        );
      }
    }
  }, [
    account,
    cellNames,
    currentCellOwnerAddress,
    mint,
    selectedCell,
    setCell,
    unSavedValue,
  ]);

  const error = useMemo(
    () => (selectedCell ? getError(selectedCell.name, unSavedValue) : null),
    [selectedCell, unSavedValue]
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
