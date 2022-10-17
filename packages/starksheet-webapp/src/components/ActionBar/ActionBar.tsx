import { Box, BoxProps } from "@mui/material";
import { useSnackbar } from "notistack";
import React, { useCallback, useContext, useEffect } from "react";
import ContentEditable from "react-contenteditable";
import { toBN } from "starknet/utils/number";
import { CELL_BORDER_WIDTH } from "../../config";
import { AbisContext } from "../../contexts/AbisContext";
import { AccountContext } from "../../contexts/AccountContext";
import { CellValuesContext } from "../../contexts/CellValuesContext";
import { StarksheetContext } from "../../contexts/StarksheetContext";
import { Cell as CellType, CellChildren, CellData } from "../../types";
import { RC_BOUND } from "../../utils/constants";
import { bn2hex } from "../../utils/hexUtils";
import { resolveContractAddress } from "../../utils/sheetUtils";
import Cell from "../Cell/Cell";
import FormulaField from "../FormulaField/FormulaField";
import SaveButton from "../SaveButton/SaveButton";
import { parse, parseContractCall, toPlainTextFormula } from "./formula.utils";

export type ActionBarProps = {
  inputRef: React.RefObject<ContentEditable>;
  selectedCell: { name: string; id: number } | null;
  sx?: BoxProps["sx"];
};

function ActionBar({ inputRef, selectedCell, sx }: ActionBarProps) {
  const { getAbiForContract } = useContext(AbisContext);
  const { accountAddress } = useContext(AccountContext);
  const { selectedSheetAddress } = useContext(StarksheetContext);
  const { cellNames, currentCells, computeValue, updateCells, buildChildren } =
    useContext(CellValuesContext);
  const { enqueueSnackbar } = useSnackbar();

  const [unSavedValue, setUnsavedValue] = React.useState<string>("");
  const [cellData, setCellData] = React.useState<CellData | null>(null);
  const previousSelectedCell = React.useRef<number | null>(
    selectedCell ? selectedCell.id : null
  );

  useEffect(() => {
    if (selectedCell && previousSelectedCell.current !== selectedCell.id) {
      inputRef?.current?.el?.current?.focus();
      const currentCellId = previousSelectedCell.current;
      previousSelectedCell.current = selectedCell ? selectedCell.id : null;

      if (
        currentCellId === null ||
        cellData === null ||
        accountAddress === undefined
      ) {
        return;
      }

      const currentCell = currentCells[currentCellId];

      if (
        currentCell.contractAddress.eq(cellData.contractAddress) &&
        currentCell.selector.eq(cellData.selector) &&
        currentCell.calldata === cellData.calldata
      ) {
        return;
      }

      const _values = currentCells.map((value) => value.value);
      const updatedCells: CellType[] = [];
      computeValue(_values)(cellData)
        .then(async (value) => {
          if (!(value.eq(toBN(0)) && cellData.contractAddress.eq(RC_BOUND))) {
            updatedCells.push({
              ...currentCells[currentCellId],
              ...cellData,
              value,
            });
            _values[currentCellId] = value;

            const children: CellChildren = {};
            buildChildren(children)(currentCellId);
            const indexes = Object.entries(children)
              .sort((a, b) => a[1] - b[1])
              .map((entry) => parseInt(entry[0]))
              .map((id) => currentCells[id]);

            for (const cell of indexes) {
              if (cell.abi?.stateMutability === "view") {
                const value = await computeValue(_values)(cell);
                _values[cell.id.toNumber()] = value;
                updatedCells.push({
                  ...cell,
                  value,
                });
              }
            }
          }
          updateCells(updatedCells);
        })
        .catch((error) => {
          enqueueSnackbar(
            `Cannot compute value of cell ${cellNames[currentCellId]}, error:
              ${error}`,
            {
              variant: "error",
            }
          );
        });
    }
  }, [
    cellNames,
    enqueueSnackbar,
    getAbiForContract,
    currentCells,
    cellData,
    updateCells,
    computeValue,
    selectedCell,
    accountAddress,
    inputRef,
    buildChildren,
  ]);

  const updateCellData = useCallback(
    (_value: string) => {
      const _contractCall = parseContractCall(_value);

      if (!_contractCall) {
        let selector = toBN(0);
        try {
          selector = toBN(_value);
        } catch (e) {}
        setCellData({
          contractAddress: RC_BOUND,
          selector,
          calldata: [],
        });
        return;
      }

      const resolvedContractAddress = resolveContractAddress(
        currentCells.map((cell) => cell.value),
        toBN(_contractCall.contractAddress)
      );

      getAbiForContract(bn2hex(resolvedContractAddress)).then((abi) => {
        const _cellData = parse(_contractCall, abi);
        setCellData(_cellData);
      });
    },
    [getAbiForContract, currentCells]
  );

  const clearBar = useCallback(() => {
    setUnsavedValue("0");
  }, []);

  useEffect(() => {
    updateCellData(unSavedValue);
  }, [unSavedValue, updateCellData]);

  useEffect(() => {
    clearBar();
  }, [selectedSheetAddress, clearBar]);

  useEffect(() => {
    if (selectedCell) {
      setUnsavedValue(
        toPlainTextFormula(currentCells[selectedCell.id], cellNames)
      );
    }
  }, [selectedCell, currentCells, cellNames]);

  const owner = selectedCell
    ? "0x" + currentCells[selectedCell?.id]?.owner?.toString(16)
    : undefined;

  return (
    <Box sx={{ display: "flex", ...sx }}>
      <Cell sx={{ width: "134px", "& .content": { textAlign: "center" } }}>
        {selectedCell?.name}
      </Cell>
      <Cell
        sx={{
          flex: 1,
          marginLeft: `-${CELL_BORDER_WIDTH}px`,
          position: "static",
          overflow: "auto",
        }}
      >
        {selectedCell && (
          <Box
            sx={{
              display: "flex",
              "& .cell": { color: "#FF4F0A" },
              "& .operator": { color: "#0000FF" },
            }}
          >
            <>
              <Box sx={{ padding: "0 15px" }}>=</Box>
              <FormulaField
                inputRef={inputRef}
                setValue={setUnsavedValue}
                value={unSavedValue}
                disabled={
                  !accountAddress ||
                  (accountAddress !== owner && owner !== "0x0")
                }
              />
            </>
          </Box>
        )}
      </Cell>
      <SaveButton
        currentCellOwnerAddress={owner}
        sx={{ marginLeft: `-${CELL_BORDER_WIDTH}px` }}
      />
    </Box>
  );
}

export default ActionBar;
