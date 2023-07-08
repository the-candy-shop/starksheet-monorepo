import { Box } from "@mui/material";
import React from "react";
import { CELL_BORDER_WIDTH } from "../../config";
import { chainConfig } from "../../provider/chains";
import { ChainId } from "../../types";
import BridgeButton from "../BridgeButton/BridgeButton";
import Button from "../Button/Button";
import ConnectButton from "../ConnectButton/ConnectButton";
import GreyCell from "../GreyCell/GreyCell";
import Widget from "../Widget/Widget";

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
      {chainConfig.chainId === ChainId.STARKNET_MAINNET && (
        <>
          <BridgeButton
            onClick={() => {
              setOpenWidget(true);
            }}
            sx={{ marginLeft: `-${CELL_BORDER_WIDTH}px` }}
          />
          <Widget
            open={isOpenWidget}
            onClose={() => {
              setOpenWidget(false);
            }}
          />
        </>
      )}
      <ConnectButton
        sx={{ width: "174px", marginLeft: `-${CELL_BORDER_WIDTH}px` }}
      />
    </Box>
  );
}

export default Header;
