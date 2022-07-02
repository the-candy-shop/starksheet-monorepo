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
        display: "flex",
        flexDirection: "column",
        ...sx,
      }}
    >
      <Box
        className="content"
        sx={{
          border: `${CELL_BORDER_WIDTH}px solid black`,
          boxShadow: "inset -5px -5px 3px #DCE3ED, inset 5px 5px 3px #949EAC",
          padding: "0 10px",
          background: "#C6D2E4",
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
