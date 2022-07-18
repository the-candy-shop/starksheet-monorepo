import React from "react";
import GreyCell from "../GreyCell/GreyCell";
import { Box } from "@mui/material";
import ConnectButton from "../ConnectButton/ConnectButton";
import { CELL_BORDER_WIDTH } from "../../config";
import Button from "../Button/Button";

function Header() {
  return (
    <Box sx={{ display: "flex" }}>
      <GreyCell sx={{ flex: 1 }}>The Starksheet Project</GreyCell>
      <Button
        sx={{ marginLeft: `-${CELL_BORDER_WIDTH}px`, width: "191px" }}
        onClick={() => window.open("https://google.fr", "_blank")}
      >
        Learn more
      </Button>
      <Button
        sx={{ marginLeft: `-${CELL_BORDER_WIDTH}px`, width: "120px" }}
        onClick={() => window.open("https://google.fr", "_blank")}
      >
        FAQ
      </Button>
      <ConnectButton
        sx={{ width: "174px", marginLeft: `-${CELL_BORDER_WIDTH}px` }}
      />
    </Box>
  );
}

export default Header;
