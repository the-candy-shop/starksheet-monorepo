import { Box, BoxProps } from "@mui/material";
import { getStarknet } from "get-starknet";
import { useSnackbar } from "notistack";
import React, { useCallback, useContext, useEffect } from "react";
import ContentEditable from "react-contenteditable";
import { toBN } from "starknet/utils/number";
import { CELL_BORDER_WIDTH } from "../../config";
import { AbisContext } from "../../contexts/AbisContext";
import { CellValuesContext } from "../../contexts/CellValuesContext";
import { useSheetContract } from "../../hooks/useSheetContract";
import { Cell as CellType, CellChildren, CellData } from "../../types";
import Cell from "../Cell/Cell";
import FormulaField from "../FormulaField/FormulaField";
import LoadingDots from "../LoadingDots/LoadingDots";
import SaveButton from "../SaveButton/SaveButton";
import {
  buildFormulaDisplay,
  getDependencies,
  parse,
  RC_BOUND,
  toPlainTextFormula,
} from "./formula.utils";

export type ActionBarProps = {
  inputRef: React.RefObject<ContentEditable>;
  selectedCell: { name: string; id: number } | null;
  sx?: BoxProps["sx"];
};

function ActionBar({ inputRef, selectedCell, sx }: ActionBarProps) {
  const { cellNames, values, computeValue, updateCells, buildChildren } =
    useContext(CellValuesContext);
  const { getAbiForContract } = useContext(AbisContext);
  const { enqueueSnackbar } = useSnackbar();
  const { contract } = useSheetContract();
  const [loading, setLoading] = React.useState<boolean>(false);
  const [newDependencies, setNewDependencies] = React.useState<number[]>([]);
  const [disabled, setDisabled] = React.useState<boolean>(false);
  const [unSavedValue, setUnsavedValue] = React.useState<string>("");
  const [cellData, setCellData] = React.useState<CellData | null>(null);
  const previousSelectedCell = React.useRef<number | null>(
    selectedCell ? selectedCell.id : null
  );
  const account = getStarknet().account.address;

  const getAllDependencies = useCallback(
    (_dependencies: number[]) => (tokenId: number) => {
      const deps = getDependencies(values[tokenId].calldata);
      deps.forEach((d) => _dependencies.push(d));
      if (deps.includes(tokenId)) {
        // We break here because it's enough to conclude about a circular dep
        return;
      }
      deps.map((d) => getAllDependencies(_dependencies)(d));
    },
    [values]
  );

  useEffect(() => {
    if (
      contract &&
      selectedCell &&
      previousSelectedCell.current !== selectedCell.id
    ) {
      inputRef?.current?.el?.current?.focus();
      // 1. Save value
      const currentCell = previousSelectedCell.current;
      const updatedCells: CellType[] = [];
      if (currentCell !== null && cellData !== null && account !== undefined) {
        const _values = values.map((value) => value.value);
        computeValue(_values)(cellData)
          .then(async (value) => {
            if (!(value.eq(toBN(0)) && cellData.contractAddress.eq(RC_BOUND))) {
              updatedCells.push({
                ...values[currentCell],
                ...cellData,
                value,
              });
              _values[currentCell] = value;

              const children: CellChildren = {};
              buildChildren(children)(currentCell);
              const indexes = Object.entries(children)
                .sort((a, b) => a[1] - b[1])
                .map((entry) => parseInt(entry[0]))
                .map((id) => values[id]);

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
              `Cannot compute value of cell ${cellNames[currentCell]}, check ABI?`,
              {
                variant: "error",
              }
            );
          });
      }

      previousSelectedCell.current = selectedCell ? selectedCell.id : null;

      // 2. Update formula
      if (selectedCell) {
        setLoading(true);
        let resolvedContractAddress = values[selectedCell.id].contractAddress;
        if (resolvedContractAddress.lt(RC_BOUND)) {
          resolvedContractAddress =
            values[resolvedContractAddress.toNumber()].value;
        }
        getAbiForContract("0x" + resolvedContractAddress.toString(16))
          .then((abi) => {
            setUnsavedValue(
              toPlainTextFormula(
                {
                  abi,
                  ...values[selectedCell.id],
                },
                cellNames
              )
            );
          })
          .catch((error: any) =>
            enqueueSnackbar(error.toString(), { variant: "error" })
          )
          .finally(() => setLoading(false));
      }
    }
  }, [
    cellNames,
    contract,
    enqueueSnackbar,
    getAbiForContract,
    values,
    cellData,
    updateCells,
    computeValue,
    selectedCell,
    account,
    inputRef,
    buildChildren,
  ]);

  useEffect(() => {
    const _cellData = parse(unSavedValue);

    if (!_cellData) {
      setCellData(_cellData);
      return;
    }

    setDisabled(true);

    let _deps = getDependencies(_cellData.calldata);
    _deps.map(getAllDependencies(_deps));
    setNewDependencies(Array.from(new Set(_deps)));
    setDisabled(false);

    getAbiForContract("0x" + _cellData.contractAddress.toString(16))
      .then((abi) => {
        return Object.keys(abi).length > 0
          ? abi["0x" + _cellData.selector.toString(16)].inputs
          : [];
      })
      .then((inputs) => {
        if (inputs.filter((i) => i.type === "felt*").length > 0) {
          // TODO: this is a very naive way to handle arrays because atm the FE does not let the user pass list and felts
          _cellData.calldata = [
            toBN(_cellData.calldata.length * 2),
            ..._cellData.calldata,
          ];
        }
        setCellData(_cellData);
      });
  }, [enqueueSnackbar, getAllDependencies, getAbiForContract, unSavedValue]);

  const owner = selectedCell
    ? "0x" + values[selectedCell?.id].owner.toString(16)
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
        {loading && <LoadingDots />}
        {!loading && selectedCell && (
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
                {(!account || (account !== owner && owner !== "0x0")) && (
                  <Box
                    dangerouslySetInnerHTML={{
                      __html: buildFormulaDisplay(unSavedValue),
                    }}
                    sx={{
                      overflow: "auto",
                    }}
                  />
                )}
                {!!account && (account === owner || owner === "0x0") && (
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
        cellData={cellData}
        newDependencies={newDependencies}
        selectedCell={selectedCell}
        disabled={disabled}
        currentCellOwnerAddress={owner}
        sx={{ marginLeft: `-${CELL_BORDER_WIDTH}px` }}
      />
    </Box>
  );
}

export default ActionBar;
