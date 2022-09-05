import { Box, BoxProps } from "@mui/material";
import { useContext } from "react";
import { CELL_BORDER_WIDTH, CELL_HEIGHT } from "../../config";
import { CurrentSheetContext } from "../../contexts/CurrentSheetContext";
import starksheetContractData from "../../contract.json";
import { useSheetList } from "../../hooks/useSheetList";
import GreyCell from "../GreyCell/GreyCell";
import { SheetButton } from "../SheetButton/SheetButton";
import aspectLogo from "./aspect.png";
import discordLogo from "./discord.svg";
import mintSquareLogo from "./mintsquare.svg";
import starknetLogo from "./starknet.svg";
import twitterLogo from "./twitter.svg";

export type FooterProps = {
  sx?: BoxProps["sx"];
};

const network = process.env.REACT_APP_NETWORK;

function Footer({ sx }: FooterProps) {
  const addresses = useSheetList();
  const { currentSheetAddress } = useContext(CurrentSheetContext);

  return (
    <Box sx={{ display: "flex", ...sx }}>
      {addresses &&
        addresses.map((address, index) => (
          <SheetButton
            key={address}
            address={address}
            sx={{ marginLeft: index !== 0 ? `-${CELL_BORDER_WIDTH}px` : 0 }}
          />
        ))}
      {addresses && addresses.length === 1 && (
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
          Sheet 1 (
          <a
            href="https://starksheet.notion.site/Product-backlog-dc2507431c7f40e393e0ed3315a4064b"
            target="_blank"
            rel="noreferrer"
          >
            Coming Soon
          </a>
          )
        </GreyCell>
      )}
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
            network === "alpha-mainnet"
              ? `https://voyager.online/contract/${starksheetContractData.address}`
              : `https://goerli.voyager.online/contract/${starksheetContractData.address}`,
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
            network === "alpha-mainnet"
              ? `https://aspect.co/collection/${currentSheetAddress}`
              : `https://testnet.aspect.co/collection/${currentSheetAddress}`,
            "_blank"
          )
        }
      >
        <img src={aspectLogo} alt="" style={{ width: "18px" }} />
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
            network === "alpha-mainnet"
              ? `https://mintsquare.io/collection/starknet/${currentSheetAddress}/nfts`
              : `https://mintsquare.io/collection/starknet-testnet/${currentSheetAddress}/nfts`,
            "_blank"
          )
        }
      >
        <img src={mintSquareLogo} style={{ height: "18px" }} alt="" />
      </GreyCell>
    </Box>
  );
}

export default Footer;
