import React from "react";
import { Box, BoxProps } from "@mui/material";
import { CELL_BORDER_WIDTH, CELL_HEIGHT } from "../../config";

export type GreyCellProps = React.PropsWithChildren & {
  sx?: BoxProps["sx"];
  onClick?: BoxProps["onClick"];
};

function Cell({ children, sx, onClick }: GreyCellProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        height: `${CELL_HEIGHT}px`,
        display: "flex",
        flexDirection: "column",
        ...sx,
      }}
    >
      <Box
        className="content"
        sx={{
          border: `${CELL_BORDER_WIDTH}px solid black`,
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
    </Box>
  );
}

export default Cell;
