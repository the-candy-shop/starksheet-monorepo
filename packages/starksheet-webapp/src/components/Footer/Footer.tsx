import { Box, BoxProps } from "@mui/material";
import { getStarknet } from "get-starknet";
import { useSnackbar } from "notistack";
import { useContext } from "react";
import { CELL_BORDER_WIDTH, CELL_HEIGHT } from "../../config";
import { AccountContext } from "../../contexts/AccountContext";
import { AppStatusContext } from "../../contexts/AppStatusContext";
import { StarksheetContext } from "../../contexts/StarksheetContext";
import starksheetContractData from "../../contract.json";
import { useStarksheetContract } from "../../hooks/useStarksheetContract";
import { starknetRpcProvider } from "../../provider";
import { str2hex } from "../../utils/hexUtils";
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
  const { accountAddress, proof } = useContext(AccountContext);
  const { starksheet, selectedSheetAddress, setSelectedSheet, updateSheets } =
    useContext(StarksheetContext);
  const { updateAppStatus } = useContext(AppStatusContext);
  const { contract } = useStarksheetContract();
  const { enqueueSnackbar } = useSnackbar();

  contract.connect(getStarknet().account);

  const addSheet = async () => {
    if (!accountAddress) {
      enqueueSnackbar(`Connect your wallet to use Starksheet`, {
        variant: "info",
      });
      return;
    }

    updateAppStatus({
      message: "Adding a new sheet",
      loading: true,
    });
    try {
      const tx = await contract.invoke("addSheet", [
        str2hex(`Sheet${starksheet.sheets.length}`),
        str2hex(`SHT${starksheet.sheets.length}`),
        proof,
      ]);
      await starknetRpcProvider.waitForTransaction(tx.transaction_hash);
      await updateSheets();
      setSelectedSheet(starksheet.sheets.length);
    } catch (e) {
      console.log("addSheetError", e);
    } finally {
      updateAppStatus({ message: "", loading: false });
    }
  };

  return (
    <Box sx={{ display: "flex", ...sx }}>
      <Box sx={{ display: "flex", overflow: "auto" }}>
        {starksheet.sheets &&
          starksheet.sheets.map((sheet, index) => (
            <SheetButton
              sheet={sheet}
              index={index}
              key={sheet.address}
              sx={{ marginLeft: index !== 0 ? `-${CELL_BORDER_WIDTH}px` : 0 }}
            />
          ))}
        <GreyCell
          sx={{
            marginLeft: `-${CELL_BORDER_WIDTH}px`,
            width: `${CELL_HEIGHT}px`,
            cursor: "pointer",
            "& .content": { justifyContent: "center" },
          }}
          onClick={addSheet}
        >
          +
        </GreyCell>
      </Box>
      <GreyCell
        sx={{
          flex: 1,
          marginLeft: `-${CELL_BORDER_WIDTH}px`,
        }}
      />
      <Box sx={{ display: "flex", justifyContent: "right" }}>
        <GreyCell
          sx={{
            marginLeft: `-${CELL_BORDER_WIDTH}px`,
            width: `${CELL_HEIGHT}px`,
            cursor: "pointer",
            "& .content": { justifyContent: "center" },
          }}
          onClick={() =>
            window.open(
              network === "SN_MAIN"
                ? `https://starkscan.co/contract/${starksheetContractData.address}`
                : `https://testnet.starkscan.co/contract/${starksheetContractData.address}`,
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
              network === "SN_MAIN"
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
              network === "SN_MAIN"
                ? `https://mintsquare.io/collection/starknet/${selectedSheetAddress}/nfts`
                : `https://mintsquare.io/collection/starknet-testnet/${selectedSheetAddress}/nfts`,
              "_blank"
            )
          }
        >
          <img src={mintSquareLogo} style={{ height: "18px" }} alt="" />
        </GreyCell>
      </Box>
    </Box>
  );
}

export default Footer;
