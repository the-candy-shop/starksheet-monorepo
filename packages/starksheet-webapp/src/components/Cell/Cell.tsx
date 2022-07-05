import React from "react";
import { Box, BoxProps } from "@mui/material";
import { CELL_BORDER_WIDTH, CELL_HEIGHT } from "../../config";

export type GreyCellProps = React.PropsWithChildren & {
  selected?: boolean;
  sx?: BoxProps["sx"];
  onClick?: BoxProps["onClick"];
};

function Cell({ selected = false, children, sx, onClick }: GreyCellProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        position: "relative",
        height: `${CELL_HEIGHT}px`,
        display: "flex",
        flexDirection: "column",
        cursor: onClick ? "pointer" : undefined,
        ...sx,
      }}
    >
      {selected && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            border: `${CELL_BORDER_WIDTH}px solid #0000FF`,
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              height: "8px",
              width: "8px",
              background: "#0000FF",
              right: -6,
              bottom: -6,
            }}
          />
        </Box>
      )}
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
