import { Box, BoxProps } from "@mui/material";
import React, { useContext } from "react";
import { CELL_BORDER_WIDTH, CELL_WIDTH } from "../../config";
import { CellValuesContext } from "../../contexts/CellValuesContext";
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

            return (
              <ComputedCell
                key={`${columnName}${rowName}`}
                name={`${columnName}${rowName}`}
                id={id}
                cell={currentCells[id]}
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
