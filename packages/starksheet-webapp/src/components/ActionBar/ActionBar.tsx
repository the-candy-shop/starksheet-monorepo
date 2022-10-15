import { Box, BoxProps } from "@mui/material";
import { useSnackbar } from "notistack";
import React, { useContext, useEffect } from "react";
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
import {
  buildFormulaDisplay,
  parse,
  toPlainTextFormula,
} from "./formula.utils";

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
      // Focus on FormulaField
      inputRef?.current?.el?.current?.focus();

      // 1. Save value
      if (
        previousSelectedCell.current !== null &&
        cellData !== null &&
        accountAddress !== undefined
      ) {
        const _values = currentCells.map((value) => value.value);
        const currentCell = previousSelectedCell.current;
        const updatedCells: CellType[] = [];
        computeValue(_values)(cellData)
          .then(async (value) => {
            if (!(value.eq(toBN(0)) && cellData.contractAddress.eq(RC_BOUND))) {
              updatedCells.push({
                ...currentCells[currentCell],
                ...cellData,
                value,
              });
              _values[currentCell] = value;

              const children: CellChildren = {};
              buildChildren(children)(currentCell);
              const indexes = Object.entries(children)
                .sort((a, b) => a[1] - b[1])
                .map((entry) => parseInt(entry[0]))
                .map((id) => currentCells[id]);

              for (const cell of indexes) {
                const value = await computeValue(_values)(cell);
                _values[cell.id.toNumber()] = value;
                updatedCells.push({
                  ...cell,
                  value,
                });
              }
            }
            updateCells(updatedCells);
          })
          .catch((error) => {
            enqueueSnackbar(
              `Cannot compute value of cell ${cellNames[currentCell]}, error:
              ${error}`,
              {
                variant: "error",
              }
            );
          });
      }

      previousSelectedCell.current = selectedCell ? selectedCell.id : null;

      // 2. Update formula
      if (selectedCell) {
        setUnsavedValue(
          toPlainTextFormula(currentCells[selectedCell.id], cellNames)
        );
      }
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

  useEffect(() => {
    const _cellData = parse(unSavedValue);

    if (!_cellData) {
      setCellData(_cellData);
      return;
    }

    const resolvedContractAddress = resolveContractAddress(
      currentCells.map((cell) => cell.value),
      _cellData
    );

    getAbiForContract(bn2hex(resolvedContractAddress)).then((abi) => {
      const _cellAbi = abi[bn2hex(_cellData.selector)];
      _cellData.abi = _cellAbi;
      // TODO: this is a very naive way to handle arrays because atm the FE does not let the user pass list and felts
      if (_cellAbi?.inputs.filter((i) => i.type === "felt*").length > 0) {
        _cellData.calldata = [
          toBN(_cellData.calldata.length * 2),
          ..._cellData.calldata,
        ];
      }
      setCellData(_cellData);
    });
  }, [enqueueSnackbar, getAbiForContract, unSavedValue, currentCells]);

  useEffect(() => {
    setUnsavedValue("0");
  }, [selectedSheetAddress]);

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
            {
              <>
                <Box sx={{ padding: "0 15px" }}>=</Box>
                {(!accountAddress ||
                  (accountAddress !== owner && owner !== "0x0")) && (
                  <Box
                    dangerouslySetInnerHTML={{
                      __html: buildFormulaDisplay(unSavedValue),
                    }}
                    sx={{
                      overflow: "auto",
                    }}
                  />
                )}
                {!!accountAddress &&
                  (accountAddress === owner || owner === "0x0") && (
                    <FormulaField
                      inputRef={inputRef}
                      setValue={setUnsavedValue}
                      onChange={() => {
                        setUnsavedValue(
                          inputRef?.current?.el.current.innerText
                            .trim()
                            .replaceAll("\n", "")
                            .replaceAll("\r", "")
                        );
                      }}
                      value={unSavedValue}
                    />
                  )}
              </>
            }
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
