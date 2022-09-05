import { Box, BoxProps } from "@mui/material";
import { useStarknet } from "@starknet-react/core";
import { useContext, useMemo } from "react";
import { CELL_BORDER_WIDTH, CELL_HEIGHT } from "../../config";
import { CellValuesContext } from "../../contexts/CellValuesContext";
import { CurrentSheetContext } from "../../contexts/CurrentSheetContext";
import starksheetContractData from "../../contract.json";
import { useSheetList } from "../../hooks/useSheetList";
import { useStarksheetContract } from "../../hooks/useStarksheetContract";
import { starknetRpcProvider } from "../../provider";
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
const str2hex = (s: string) =>
  "0x" +
  Array.from(Array(s.length).keys())
    .map((i) => s.charCodeAt(i).toString(16))
    .join("");
function Footer({ sx }: FooterProps) {
  const { addresses, updateAddresses } = useSheetList();
  const { account } = useStarknet();
  const { currentSheetAddress, setCurrentSheetAddress } =
    useContext(CurrentSheetContext);
  const { setLoading, setMessage } = useContext(CellValuesContext);
  const { contract } = useStarksheetContract();

  const addressProof = useMemo(
    // @ts-ignore
    () => starksheetContractData.allowlist[account] || [],
    [account]
  );

  const addSheet = async () => {
    if (!account) return;
    setMessage("Adding a new sheet");
    setLoading(true);
    const tx = await contract.invoke("addSheet", [
      str2hex(`Sheet${addresses.length}`),
      str2hex(`SHT${addresses.length}`),
      addressProof,
    ]);
    await starknetRpcProvider.waitForTransaction(tx.transaction_hash);
    const newAddresses = await updateAddresses();
    setMessage("");
    setLoading(false);
    setCurrentSheetAddress(newAddresses.slice(-1)[0]);
  };

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
