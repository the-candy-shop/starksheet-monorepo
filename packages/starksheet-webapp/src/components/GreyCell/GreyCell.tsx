import { Box, BoxProps } from "@mui/material";
import React from "react";
import { CELL_BORDER_WIDTH, CELL_HEIGHT } from "../../config";

export type GreyCellProps = React.PropsWithChildren & {
  variant?: "1" | "2" | "3";
  sx?: BoxProps["sx"];
  onClick?: BoxProps["onClick"];
};

function GreyCell({ variant = "1", children, sx, onClick }: GreyCellProps) {
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
          boxShadow:
            variant === "1"
              ? "inset -5px -5px 3px #DCE3ED, inset 5px 5px 3px #949EAC"
              : "inset -5px -5px 3px #F4F4F4, inset 5px 5px 3px #B7B7B8",
          background:
            variant === "1"
              ? "#C6D2E4"
              : variant === "2"
              ? "#E1E1E1"
              : "#FF8C00",
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

export default GreyCell;
