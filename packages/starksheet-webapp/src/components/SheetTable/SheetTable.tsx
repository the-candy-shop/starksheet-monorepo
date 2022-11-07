import { Box, BoxProps } from "@mui/material";
import React, { useContext, useMemo } from "react";
import { CELL_BORDER_WIDTH, CELL_WIDTH, N_COL, N_ROW } from "../../config";
import { CellValuesContext } from "../../contexts/CellValuesContext";
import { Cell } from "../../types";
import ComputedCell from "../ComputedCell/ComputedCell";
import GreyCell from "../GreyCell/GreyCell";

export type SheetTableProps = {
  currentCells: Cell[];
  sx?: BoxProps["sx"];
};

const SheetTable = ({ currentCells, sx }: SheetTableProps) => {
  const colNames = useMemo(
    () =>
      Array.from(Array(N_COL + 1).keys())
        .map((i) => (i + 9).toString(36).toUpperCase())
        .slice(1),
    []
  );

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
        {colNames.map((name) => (
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
      {Array.from(Array(N_ROW).keys()).map((rowIndex) => (
        <Box
          key={rowIndex}
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
            {rowIndex + 1}
          </GreyCell>
          {colNames.map((name, colIndex) => {
            const cell = currentCells[colIndex + N_COL * rowIndex];
            return <ComputedCell key={`${name}${rowIndex + 1}`} cell={cell} />;
          })}
        </Box>
      ))}
    </Box>
  );
};

const withStaticValueFromContext = (
  Component: ({ currentCells, sx }: SheetTableProps) => JSX.Element
) => {
  const ComponentMemo = React.memo(Component);

  return (props: Omit<SheetTableProps, "currentCells">) => {
    const { currentCells } = useContext(CellValuesContext);
    return <ComponentMemo currentCells={currentCells} {...props} />;
  };
};

export default withStaticValueFromContext(SheetTable);
