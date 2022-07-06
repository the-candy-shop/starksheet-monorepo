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
      <GreyCell
        sx={{ width: "146px", "& .content": { justifyContent: "center" } }}
      >
        Sheet 1
      </GreyCell>
      <GreyCell
        sx={{
          marginLeft: `-${CELL_BORDER_WIDTH}px`,
          width: "345px",
          "& .content": {
            justifyContent: "center",
            color: "rgba(0,0,0,0.5)",
          },
        }}
      >
        Sheet 2 (
        <a href="#" target="_blank">
          Coming Soon
        </a>
        )
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
