import React from "react";
import { Box, BoxProps } from "@mui/material";
import Cell from "../Cell/Cell";

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
    </Box>
  );
}

export default ActionBar;
