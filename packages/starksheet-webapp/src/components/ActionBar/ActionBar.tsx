import { Box, BoxProps } from "@mui/material";
import { useSnackbar } from "notistack";
import React, { useCallback, useContext, useEffect } from "react";
import ContentEditable from "react-contenteditable";
import { toBN } from "starknet/utils/number";
import { CELL_BORDER_WIDTH } from "../../config";
import { AbisContext } from "../../contexts/AbisContext";
import { AccountContext } from "../../contexts/AccountContext";
import { CellValuesContext } from "../../contexts/CellValuesContext";
import { OnsheetContext } from "../../contexts/OnsheetContext";
import { Cell as CellType, CellData, CellGraph } from "../../types";
import { RC_BOUND } from "../../utils/constants";
import { bn2hex, str2hex } from "../../utils/hexUtils";
import { resolveContractAddress } from "../../utils/sheetUtils";
import Cell from "../Cell/Cell";
import FormulaField from "../FormulaField/FormulaField";
import SaveButton from "../SaveButton/SaveButton";
import {
  parse,
  parseContractCall,
  tokenIdToCellName,
  toPlainTextFormula,
} from "./formula.utils";

export type ActionBarProps = {
  inputRef: React.RefObject<ContentEditable>;
  sx?: BoxProps["sx"];
};

function ActionBar({ inputRef, sx }: ActionBarProps) {
  const { getAbiForContract } = useContext(AbisContext);
  const { accountAddress } = useContext(AccountContext);
  const { selectedSheetAddress } = useContext(OnsheetContext);
  const {
    currentCells,
    computeValue,
    updateCells,
    buildChildren,
    selectedCell,
  } = useContext(CellValuesContext);
  const { enqueueSnackbar } = useSnackbar();

  const [unSavedValue, setUnsavedValue] = React.useState<string>("");
  const [cellData, setCellData] = React.useState<CellData | null>(null);

  const previousSelectedCell = React.useRef<number>(selectedCell);

  useEffect(() => {
    if (previousSelectedCell.current !== selectedCell) {
      const currentCellId = previousSelectedCell.current;
      previousSelectedCell.current = selectedCell;

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
        currentCell.calldata.length === cellData.calldata.length &&
        currentCell.calldata.every((c, i) => c.eq(cellData.calldata[i]))
      ) {
        return;
      }

      const _values = currentCells.map((value) => value.value);
      const updatedCells: CellType[] = [];
      computeValue(_values)(cellData)
        .then(async (value) => {
          let error = false;
          updatedCells.push({
            ...currentCells[currentCellId],
            ...cellData,
            value,
            error,
          });
          _values[currentCellId] = value;

          const children: CellGraph = {};
          buildChildren(children)(currentCellId);
          const indexes = Object.entries(children)
            .sort((a, b) => a[1] - b[1])
            .map((entry) => parseInt(entry[0]))
            .map((id) => currentCells[id])
            .filter((cell) => cell.abi?.stateMutability === "view");

          for (const cell of indexes) {
            let value = cell.value;
            if (!error) {
              try {
                value = await computeValue(_values)(cell);
                _values[cell.id.toNumber()] = value;
              } catch (e) {
                error = true;
              }
            }
            updatedCells.push({
              ...cell,
              value,
              error,
            });
          }
        })
        .catch((error) => {
          enqueueSnackbar(
            `Cannot compute value of cell ${tokenIdToCellName(
              currentCellId
            )}, error:
              ${error}`,
            {
              variant: "error",
            }
          );
          updatedCells.push({
            ...currentCells[currentCellId],
            ...cellData,
            error: true,
          });
        })
        .finally(() => {
          updateCells(updatedCells);
        });
    }
  }, [
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
        } catch (e) {
          try {
            selector = toBN(str2hex(_value));
          } catch (e) {
            selector = toBN(0);
          }
        }
        setCellData({
          contractAddress: RC_BOUND,
          selector,
          calldata: [],
        });
        return;
      }

      let contractAddress;
      try {
        contractAddress = toBN(_contractCall.contractAddress);
      } catch (e) {
        return;
      }

      const resolvedContractAddress = resolveContractAddress(
        currentCells.map((cell) => cell.value),
        contractAddress
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
    setUnsavedValue(toPlainTextFormula(currentCells[selectedCell]));
  }, [selectedCell, currentCells]);

  const owner = currentCells[selectedCell]?.owner?.toString(16);

  return (
    <Box sx={{ display: "flex", ...sx }}>
      <Cell sx={{ width: "134px", "& .content": { textAlign: "center" } }}>
        {!!selectedSheetAddress && tokenIdToCellName(selectedCell)}
      </Cell>
      <Cell
        sx={{
          flex: 1,
          marginLeft: `-${CELL_BORDER_WIDTH}px`,
          position: "static",
          overflow: "auto",
        }}
      >
        {!!selectedSheetAddress && (
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
                  (accountAddress !== "0x" + owner && owner !== "0")
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
