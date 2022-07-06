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
            top: `${CELL_BORDER_WIDTH}px`,
            left: `${CELL_BORDER_WIDTH}px`,
            bottom: `${CELL_BORDER_WIDTH}px`,
            right: `${CELL_BORDER_WIDTH}px`,
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
          padding: "13px 10px",
          fontFamily: "'Press Start 2P', cursive",
          fontSize: "14px",
          lineHeight: "20px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          flex: 1,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default Cell;
