import { Box, BoxProps } from "@mui/material";
import { useSnackbar } from "notistack";
import { useContext } from "react";
import { CELL_BORDER_WIDTH, CELL_HEIGHT } from "../../config";
import { AccountContext } from "../../contexts/AccountContext";
import { StarksheetContext } from "../../contexts/StarksheetContext";
import { network } from "../../provider";
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

function Footer({ sx }: FooterProps) {
  const { accountAddress } = useContext(AccountContext);
  const { starksheet, selectedSheetAddress, addSheet } =
    useContext(StarksheetContext);
  const { enqueueSnackbar } = useSnackbar();

  const addSheetOnClick = async () => {
    if (!accountAddress) {
      enqueueSnackbar(`Connect your wallet to use Starksheet`, {
        variant: "info",
      });
      return;
    }
    addSheet(
      {
        name: `Sheet${starksheet.sheets.length}`,
        symbol: `SHT${starksheet.sheets.length}`,
      },
      accountAddress
    );
  };

  return (
    <GreyCell sx={{ display: "flex", ...sx }}>
      <GreyCell
        sx={{
          minWidth: `${CELL_HEIGHT}px`,
          cursor: "pointer",
          "& .content": { justifyContent: "center" },
          marginLeft: `-${CELL_BORDER_WIDTH}px`,
          marginTop: `-${CELL_BORDER_WIDTH}px`,
        }}
        onClick={addSheetOnClick}
      >
        +
      </GreyCell>
      <Box
        sx={{
          display: "flex",
          overflow: "auto",
          marginTop: `-${CELL_BORDER_WIDTH}px`,
        }}
      >
        {starksheet.sheets &&
          starksheet.sheets.map((sheet, index) => (
            <SheetButton
              sheet={sheet}
              index={index}
              key={sheet.address}
              sx={{
                marginLeft: `-${CELL_BORDER_WIDTH}px`,
              }}
            />
          ))}
      </Box>
      <Box
        sx={{
          display: "flex",
          marginLeft: "auto",
          marginTop: `-${CELL_BORDER_WIDTH}px`,
          marginRight: `-${CELL_BORDER_WIDTH}px`,
        }}
      >
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
                ? `https://starkscan.co/contract/${selectedSheetAddress}`
                : `https://testnet.starkscan.co/contract/${selectedSheetAddress}`,
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
          onClick={() =>
            window.open("https://twitter.com/starksheet", "_blank")
          }
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
                ? `https://aspect.co/collection/${selectedSheetAddress}`
                : `https://testnet.aspect.co/collection/${selectedSheetAddress}`,
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
              network === "mainnet"
                ? `https://mintsquare.io/collection/starknet/${selectedSheetAddress}/nfts`
                : `https://mintsquare.io/collection/starknet-testnet/${selectedSheetAddress}/nfts`,
              "_blank"
            )
          }
        >
          <img src={mintSquareLogo} style={{ height: "18px" }} alt="" />
        </GreyCell>
      </Box>
    </GreyCell>
  );
}

export default Footer;
