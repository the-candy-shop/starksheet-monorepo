import React from "react";
import { Box, BoxProps } from "@mui/material";
import { CELL_BORDER_WIDTH, CELL_HEIGHT } from "../../config";

export type GreyCellProps = React.PropsWithChildren & {
  sx?: BoxProps["sx"];
  onClick?: BoxProps["onClick"];
};

function GreyCell({ children, sx, onClick }: GreyCellProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        height: `${CELL_HEIGHT}px`,
        border: `${CELL_BORDER_WIDTH}px solid black`,
        background: "#C6D2E4",
        boxShadow: "inset -5px -5px 3px #DCE3ED, inset 5px 5px 3px #949EAC",
        fontFamily: "'Press Start 2P', cursive",
        fontSize: "14px",
        lineHeight: "20px",
        display: "flex",
        alignItems: "center",
        padding: "0 10px",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

export default GreyCell;
