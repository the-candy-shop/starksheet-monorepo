import React from "react";
import GreyCell from "../GreyCell/GreyCell";
import { Box } from "@mui/material";
import ConnectButton from "../ConnectButton/ConnectButton";
import { CELL_BORDER_WIDTH } from "../../config";

function Header() {
  return (
    <Box sx={{ display: "flex" }}>
      <GreyCell sx={{ flex: 1 }}>The Starksheet Project</GreyCell>
      <ConnectButton
        sx={{ width: "174px", marginLeft: `-${CELL_BORDER_WIDTH}px` }}
      />
    </Box>
  );
}

export default Header;
