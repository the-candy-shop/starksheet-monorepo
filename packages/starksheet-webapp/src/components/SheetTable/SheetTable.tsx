import React from "react";
import { generateColumnNames, generateRowNames } from "../../utils/sheetUtils";
import GreyCell from "../GreyCell/GreyCell";
import { CELL_BORDER_WIDTH, CELL_WIDTH } from "../../config";
import { Box, BoxProps } from "@mui/material";
import Cell from "../Cell/Cell";

export type SheetTableProps = {
  rows?: number;
  columns?: number;
  sx?: BoxProps["sx"];
};

function SheetTable({ rows = 15, columns = 15, sx }: SheetTableProps) {
  const columnNames = React.useMemo(
    () => generateColumnNames(columns),
    [columns]
  );
  const rowNames = React.useMemo(() => generateRowNames(rows), [rows]);

  return (
    <Box sx={{ position: "relative", ...sx }}>
      <Box sx={{ display: "flex", position: "sticky", top: 0, zIndex: 1 }}>
        <GreyCell
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
      {rowNames.map((rowName) => (
        <Box sx={{ display: "flex", marginTop: `-${CELL_BORDER_WIDTH}px` }}>
          <GreyCell
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
          {columnNames.map((columnName) => (
            <Cell
              sx={{
                width: `${CELL_WIDTH}px`,
                minWidth: `${CELL_WIDTH}px`,
                maxWidth: `${CELL_WIDTH}px`,
                marginLeft: `-${CELL_BORDER_WIDTH}px`,
              }}
            >
              {columnName}:{rowName}
            </Cell>
          ))}
        </Box>
      ))}
    </Box>
  );
}

export default SheetTable;
