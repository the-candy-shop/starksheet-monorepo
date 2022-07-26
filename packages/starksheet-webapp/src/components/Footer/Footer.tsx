import React from "react";
import GreyCell from "../GreyCell/GreyCell";
import { Box, BoxProps } from "@mui/material";
import { CELL_BORDER_WIDTH, CELL_HEIGHT } from "../../config";
import twitterLogo from "./twitter.svg";
import starknetLogo from "./starknet.svg";
import aspectLogo from "./aspect.png";
import discordLogo from "./discord.svg";
import StarkSheetContract from "../../contract.json";

export type FooterProps = {
  sx?: BoxProps["sx"];
};

const network = process.env.REACT_APP_NETWORK;

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
        <a
          href="https://starksheet.notion.site/Starksheet-Roadmap-146530d01d914d6fae8c8779b99d58ec"
          target="_blank"
          rel="noreferrer"
        >
          Coming Soon
        </a>
        )
      </GreyCell>
      <GreyCell
        sx={{
          flex: 1,
          marginLeft: `-${CELL_BORDER_WIDTH}px`,
        }}
      />
      <GreyCell
        sx={{
          marginLeft: `-${CELL_BORDER_WIDTH}px`,
          width: `${CELL_HEIGHT}px`,
          cursor: "pointer",
          "& .content": { justifyContent: "center" },
        }}
        onClick={() =>
          window.open(
            network === "mainnet"
              ? `https://voyager.online/contract/${StarkSheetContract.address}`
              : `https://goerli.voyager.online/contract/${StarkSheetContract.address}`,
            "_blank"
          )
        }
      >
        <img src={starknetLogo} alt="" />
      </GreyCell>
      <GreyCell
        sx={{
          marginLeft: `-${CELL_BORDER_WIDTH}px`,
          width: `${CELL_HEIGHT}px`,
          cursor: "pointer",
          "& .content": { justifyContent: "center" },
        }}
        onClick={() => window.open("https://discord.gg/Aab6qdWb5k", "_blank")}
      >
        <img src={discordLogo} alt="" />
      </GreyCell>
      <GreyCell
        sx={{
          marginLeft: `-${CELL_BORDER_WIDTH}px`,
          width: `${CELL_HEIGHT}px`,
          cursor: "pointer",
          "& .content": { justifyContent: "center" },
        }}
        onClick={() => window.open("https://twitter.com/starksheet", "_blank")}
      >
        <img src={twitterLogo} alt="" />
      </GreyCell>
      <GreyCell
        sx={{
          marginLeft: `-${CELL_BORDER_WIDTH}px`,
          width: `${CELL_HEIGHT}px`,
          cursor: "pointer",
          "& .content": { justifyContent: "center" },
        }}
        onClick={() =>
          window.open(
            network === "mainnet"
              ? `https://aspect.co/collection/${StarkSheetContract.address}`
              : `https://testnet.aspect.co/collection/${StarkSheetContract.address}`,
            "_blank"
          )
        }
      >
        <img src={aspectLogo} alt="" style={{ width: "18px" }} />
      </GreyCell>
    </Box>
  );
}

export default Footer;
