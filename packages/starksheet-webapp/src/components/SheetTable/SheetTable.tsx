import { Box, BoxProps } from "@mui/material";
import BN from "bn.js";
import React, { useContext } from "react";
import { constants } from "starknet";
import { getSelectorFromName } from "starknet/dist/utils/hash";
import { toBN, toHex } from "starknet/utils/number";
import { CELL_BORDER_WIDTH, CELL_WIDTH } from "../../config";
import { CellValuesContext } from "../../contexts/CellValuesContext";
import { Cell } from "../../types";
import { hex2str } from "../../utils/hexUtils";
import { generateColumnNames, generateRowNames } from "../../utils/sheetUtils";
import ComputedCell from "../ComputedCell/ComputedCell";
import GreyCell from "../GreyCell/GreyCell";

export type SheetTableProps = {
  selectedCell: { name: string; id: number } | null;
  setSelectedCell: (value: { name: string; id: number } | null) => void;
  rows?: number;
  columns?: number;
  sx?: BoxProps["sx"];
};

function SheetTable({
  selectedCell,
  setSelectedCell,
  rows = 15,
  columns = 15,
  sx,
}: SheetTableProps) {
  const columnNames = React.useMemo(
    () => generateColumnNames(columns),
    [columns]
  );
  const rowNames = React.useMemo(() => generateRowNames(rows), [rows]);
  const { setCellNames, currentCells } = useContext(CellValuesContext);

  React.useEffect(() => {
    const result: string[] = [];
    rowNames.forEach((rowName, rowIndex) => {
      columnNames.forEach((columnName, columnIndex) => {
        const id = columnIndex + columnNames.length * rowIndex;
        result[id] = `${columnName}${rowName}`;
      });
    });

    setCellNames(result);
  }, [columnNames, rowNames, setCellNames]);

  function getValue(cell: Cell): string {
    const value = cell.value;
    if (
      ["name", "symbol"]
        .map(getSelectorFromName)
        .includes("0x" + cell.selector.toString(16))
    ) {
      return hex2str(value.toString(16));
    }
    return value
      .add(toBN(constants.FIELD_PRIME).div(toBN(2)).abs())
      .mod(toBN(constants.FIELD_PRIME))
      .sub(toBN(constants.FIELD_PRIME).div(toBN(2)).abs())
      .toString();
  }

  return (
    <Box sx={{ position: "relative", background: "#e2e2e2", ...sx }}>
      <Box sx={{ display: "flex", position: "sticky", top: 0, zIndex: 1 }}>
        <GreyCell
          variant="2"
          sx={{
            width: `${CELL_WIDTH}px`,
            minWidth: `${CELL_WIDTH}px`,
            maxWidth: `${CELL_WIDTH}px`,
            position: "sticky",
            left: 0,
            top: 0,
            zIndex: 2,
          }}
        />
        {columnNames.map((name) => (
          <GreyCell
            key={name}
            variant="2"
            sx={{
              width: `${CELL_WIDTH}px`,
              minWidth: `${CELL_WIDTH}px`,
              maxWidth: `${CELL_WIDTH}px`,
              marginLeft: `-${CELL_BORDER_WIDTH}px`,
              "& .content": { justifyContent: "center" },
            }}
          >
            {name}
          </GreyCell>
        ))}
      </Box>
      {rowNames.map((rowName, rowIndex) => (
        <Box
          key={rowName}
          sx={{ display: "flex", marginTop: `-${CELL_BORDER_WIDTH}px` }}
        >
          <GreyCell
            variant="2"
            sx={{
              width: `${CELL_WIDTH}px`,
              minWidth: `${CELL_WIDTH}px`,
              maxWidth: `${CELL_WIDTH}px`,
              position: "sticky",
              left: 0,
              zIndex: 0,
              "& .content": { justifyContent: "center" },
            }}
          >
            {rowName}
          </GreyCell>
          {columnNames.map((columnName, columnIndex) => {
            const id: number = columnIndex + columnNames.length * rowIndex;
            const contractAddress = currentCells[id].contractAddress.toString();
            const value = currentCells[id]
              ? getValue(currentCells[id])
              : undefined;
            const owner =
              currentCells[id] && currentCells[id].owner.toString() !== "0"
                ? toHex(currentCells[id].owner as BN)
                : undefined;
            const error = currentCells[id] ? currentCells[id].error : undefined;

            return (
              <ComputedCell
                key={`${columnName}${rowName}`}
                name={`${columnName}${rowName}`}
                id={id}
                contractAddress={contractAddress}
                value={value}
                owner={owner}
                error={error}
                selected={`${columnName}${rowName}` === selectedCell?.name}
                setSelectedCell={setSelectedCell}
              />
            );
          })}
        </Box>
      ))}
    </Box>
  );
}

export default SheetTable;
