import React from "react";
import { generateColumnNames, generateRowNames } from "../../utils/sheetUtils";
import GreyCell from "../GreyCell/GreyCell";
import { CELL_BORDER_WIDTH, CELL_WIDTH } from "../../config";
import {
  TableProps,
  Table,
  TableBody,
  TableHead,
  TableRow,
} from "@mui/material";
import Cell from "../Cell/Cell";

export type SheetTableProps = {
  rows?: number;
  columns?: number;
  sx?: TableProps["sx"];
};

function SheetTable({ rows = 15, columns = 15, sx }: SheetTableProps) {
  const columnNames = React.useMemo(
    () => generateColumnNames(columns),
    [columns]
  );
  const rowNames = React.useMemo(() => generateRowNames(rows), [columns]);

  return (
    <Table
      // stickyHeader
      aria-label="sticky table"
      sx={{
        borderCollapse: "collapse",
        width: "auto",
        whiteSpace: "nowrap",
        tableLayout: "fixed",
        borderSpacing: 0,
        ...sx,
      }}
    >
      <TableHead>
        <TableRow>
          <GreyCell
            sx={{
              width: `${CELL_WIDTH - 2 * CELL_BORDER_WIDTH}px`,
              minWidth: `${CELL_WIDTH - 2 * CELL_BORDER_WIDTH}px`,
              maxWidth: `${CELL_WIDTH - 2 * CELL_BORDER_WIDTH}px`,
              position: "sticky",
              top: 0,
              left: 0,
              zIndex: 2,
            }}
          />
          {columnNames.map((name) => (
            <GreyCell
              sx={{
                width: `${CELL_WIDTH - 2 * CELL_BORDER_WIDTH}px`,
                minWidth: `${CELL_WIDTH - 2 * CELL_BORDER_WIDTH}px`,
                maxWidth: `${CELL_WIDTH - 2 * CELL_BORDER_WIDTH}px`,
                position: "sticky",
                top: 0,
                zIndex: 1,
                "& .content": { justifyContent: "center" },
              }}
            >
              {name}
            </GreyCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rowNames.map((rowName) => (
          <TableRow>
            <GreyCell
              sx={{
                width: `${CELL_WIDTH - 2 * CELL_BORDER_WIDTH}px`,
                minWidth: `${CELL_WIDTH - 2 * CELL_BORDER_WIDTH}px`,
                maxWidth: `${CELL_WIDTH - 2 * CELL_BORDER_WIDTH}px`,
                position: "sticky",
                left: 0,
                zIndex: 1,
                "& .content": { justifyContent: "center" },
              }}
            >
              {rowName}
            </GreyCell>
            {columnNames.map((columnName) => (
              <Cell
                sx={{
                  width: `${CELL_WIDTH - 2 * CELL_BORDER_WIDTH}px`,
                  minWidth: `${CELL_WIDTH - 2 * CELL_BORDER_WIDTH}px`,
                  maxWidth: `${CELL_WIDTH - 2 * CELL_BORDER_WIDTH}px`,
                }}
              >
                {columnName}:{rowName}
              </Cell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default SheetTable;
