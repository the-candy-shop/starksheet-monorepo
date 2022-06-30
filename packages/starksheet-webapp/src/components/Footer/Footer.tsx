import React from "react";
import GreyCell from "../GreyCell/GreyCell";
import { Box } from "@mui/material";
import ConnectButton from "../ConnectButton/ConnectButton";
import { CELL_BORDER_WIDTH } from "../../config";

function Footer() {
  return (
    <Box sx={{ display: "flex" }}>
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
