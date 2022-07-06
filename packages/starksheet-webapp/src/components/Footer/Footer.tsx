import React from "react";
import GreyCell from "../GreyCell/GreyCell";
import { Box, BoxProps } from "@mui/material";
import { CELL_BORDER_WIDTH } from "../../config";

export type FooterProps = {
  sx?: BoxProps["sx"];
};

function Footer({ sx }: FooterProps) {
  return (
    <Box sx={{ display: "flex", ...sx }}>
      <GreyCell>Sheet 1</GreyCell>
      <GreyCell sx={{ marginLeft: `-${CELL_BORDER_WIDTH}px` }}>
        Sheet 2 (Coming Soon)
      </GreyCell>
      <GreyCell sx={{ flex: 1, marginLeft: `-${CELL_BORDER_WIDTH}px` }} />
      <GreyCell sx={{ marginLeft: `-${CELL_BORDER_WIDTH}px` }}>i</GreyCell>
      <GreyCell sx={{ marginLeft: `-${CELL_BORDER_WIDTH}px` }}>i</GreyCell>
      <GreyCell sx={{ marginLeft: `-${CELL_BORDER_WIDTH}px` }}>i</GreyCell>
      <GreyCell sx={{ marginLeft: `-${CELL_BORDER_WIDTH}px` }}>i</GreyCell>
    </Box>
  );
}

export default Footer;
