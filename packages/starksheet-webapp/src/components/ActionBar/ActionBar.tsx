import React from "react";
import { Box, BoxProps } from "@mui/material";
import Cell from "../Cell/Cell";
import { CELL_BORDER_WIDTH } from "../../config";
import Button from "../Button/Button";

export type ActionBarProps = {
  selectedCell: string | null;
  sx?: BoxProps["sx"];
};

function ActionBar({ selectedCell, sx }: ActionBarProps) {
  return (
    <Box sx={{ display: "flex", ...sx }}>
      <Cell sx={{ width: "134px", "& .content": { justifyContent: "center" } }}>
        {selectedCell}
      </Cell>
      <Cell sx={{ flex: 1, marginLeft: `-${CELL_BORDER_WIDTH}px` }}>
        {selectedCell}
      </Cell>
      <Button
        sx={{
          marginLeft: `-${CELL_BORDER_WIDTH}px`,
          width: "221px",

          "& .content": {
            backgroundColor: "#FF4F0A",
            boxShadow: "inset -5px -5px 3px #FF8555, inset 5px 5px 3px #D9450B",
            justifyContent: "center",
          },
        }}
        onClick={() => {}}
      >
        Save Value
      </Button>
    </Box>
  );
}

export default ActionBar;
