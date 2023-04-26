import { Box } from "@mui/material";
import { CELL_BORDER_WIDTH } from "../../config";
import Button from "../Button/Button";
import ConnectButton from "../ConnectButton/ConnectButton";
import GreyCell from "../GreyCell/GreyCell";
import BridgeButton from '../BridgeButton/BridgeButton';
import Widget from '../Widget/Widget';
import React from 'react';

function Header() {
  const [isOpenWidget, setOpenWidget] = React.useState<boolean>(false);
  return (
    <Box sx={{ display: "flex" }}>
      <GreyCell sx={{ textIndent: "20px", flex: 1 }}>Starksheet</GreyCell>
      <Button
        sx={{ marginLeft: `-${CELL_BORDER_WIDTH}px`, width: "191px" }}
        onClick={() =>
          window.open(
            "https://starksheet.notion.site/starksheet/Starksheet-bfb55bc581e446598d7bf5860e219b03",
            "_blank"
          )
        }
      >
        Learn more
      </Button>
      <BridgeButton
        onClick={() => {
          setOpenWidget(true)
        }}
        sx={{ marginLeft: `-${CELL_BORDER_WIDTH}px` }}
      />
      <ConnectButton
        sx={{ width: "174px", marginLeft: `-${CELL_BORDER_WIDTH}px` }}
      />
      <Widget
        open={isOpenWidget}
        onClose={() => {
          setOpenWidget(false)
        }}
      />
    </Box>
  );
}

export default Header;
