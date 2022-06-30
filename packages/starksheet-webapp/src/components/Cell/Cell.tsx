import React from "react";
import { Box, TableCell, TableCellProps } from "@mui/material";
import { CELL_BORDER_WIDTH, CELL_HEIGHT } from "../../config";

export type CellProps = React.PropsWithChildren & {
  sx?: TableCellProps["sx"];
  onClick?: TableCellProps["onClick"];
};

function Cell({ children, sx, onClick }: CellProps) {
  return (
    <TableCell
      onClick={onClick}
      sx={{
        height: `${CELL_HEIGHT - 2 * CELL_BORDER_WIDTH}px`,
        border: `${CELL_BORDER_WIDTH}px solid black`,
        background: "white",
        padding: 0,
        borderCollapse: "collapse",
        ...sx,
      }}
    >
      <Box
        className="content"
        sx={{
          height: "100%",
          padding: "0 10px",
          fontFamily: "'Press Start 2P', cursive",
          fontSize: "14px",
          lineHeight: "20px",
          display: "flex",
          alignItems: "center",
          flex: 1,
        }}
      >
        {children}
      </Box>
    </TableCell>
  );
}

export default Cell;
