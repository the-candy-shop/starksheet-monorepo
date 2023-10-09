import { Box, BoxProps } from "@mui/material";
import { useSnackbar } from "notistack";
import { useContext } from "react";
import { CELL_BORDER_WIDTH, CELL_HEIGHT, N_ROW } from "../../config";
import { AccountContext } from "../../contexts/AccountContext";
import { OnsheetContext } from "../../contexts/OnsheetContext";
import { useChainProvider } from "../../hooks/useChainProvider";
import { chainConfig } from "../../provider/chains";
import GreyCell from "../GreyCell/GreyCell";
import { SheetButton } from "../SheetButton/SheetButton";
import githubLogo from "./../../assets/github.svg";
import telegramLogo from "./../../assets/telegram.svg";
import twitterLogo from "./../../assets/twitter.svg";

export type FooterProps = {
  sx?: BoxProps["sx"];
};

function Footer({ sx }: FooterProps) {
  const { accountAddress } = useContext(AccountContext);
  const { onsheet, selectedSheetAddress, addSheet } =
    useContext(OnsheetContext);
  const { enqueueSnackbar } = useSnackbar();
  const chainProvider = useChainProvider();

  const addSheetOnClick = async () => {
    if (!accountAddress) {
      enqueueSnackbar(`Connect your wallet to use ${chainConfig.appName}`, {
        variant: "info",
      });
      return;
    }
    await addSheet(
      {
        name: `Sheet${onsheet.sheets.length}`,
        symbol: `SHT${onsheet.sheets.length}`,
        nRow: N_ROW,
        cellPrice: 0n,
        sheetPrice: 0n,
      },
      accountAddress,
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
        {onsheet.sheets &&
          onsheet.sheets.map((sheet, index) => (
            <SheetButton
              sheet={sheet}
              index={index}
              key={sheet.address}
              sx={{
                marginLeft: `-${CELL_BORDER_WIDTH}px`,
                overflowY: "hidden",
                overflowX: "auto",
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
              selectedSheetAddress
                ? chainProvider.getExplorerAddress(selectedSheetAddress)
                : "",
              "_blank",
            )
          }
        >
          <img
            src={chainConfig.explorerLogo}
            style={{ height: "18px" }}
            alt=""
          />
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
              "https://github.com/the-candy-shop/starksheet-monorepo/",
              "_blank",
            )
          }
        >
          <img src={githubLogo} alt="" />
        </GreyCell>
        <GreyCell
          sx={{
            marginLeft: `-${CELL_BORDER_WIDTH}px`,
            width: `${CELL_HEIGHT}px`,
            cursor: "pointer",
            "& .content": { justifyContent: "center" },
          }}
          onClick={() => window.open("https://t.me/starksheet", "_blank")}
        >
          <img src={telegramLogo} alt="" />
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
              selectedSheetAddress
                ? chainProvider.getNftMarketplaceAddress(selectedSheetAddress)
                : "",
              "_blank",
            )
          }
        >
          <img src={chainConfig.nftLogo} style={{ height: "18px" }} alt="" />
        </GreyCell>
      </Box>
    </GreyCell>
  );
}

export default Footer;
