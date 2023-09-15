import { Box } from "@mui/material";
import React, { useContext, useMemo, useState } from "react";
import { CELL_BORDER_WIDTH } from "../../config";
import { AccountContext } from "../../contexts/AccountContext";
import { OnsheetContext } from "../../contexts/OnsheetContext";
import { TransactionsContext } from "../../contexts/TransactionsContext";
import { useSheetContract } from "../../hooks";
import { chainConfig } from "../../provider/chains";
import { ChainId } from "../../types";
import BridgeButton from "../BridgeButton/BridgeButton";
import Button from "../Button/Button";
import ConnectButton from "../ConnectButton/ConnectButton";
import GreyCell from "../GreyCell/GreyCell";
import LoadingDots from "../LoadingDots/LoadingDots";
import Widget from "../Widget/Widget";

function Header() {
  const { onsheet, selectedSheetAddress, appendSheet } =
    useContext(OnsheetContext);
  const { accountAddress } = useContext(AccountContext);
  const { settleTransactions } = useContext(TransactionsContext);
  const sheet = useMemo(
    () =>
      onsheet.sheets.find((sheet) => sheet.address === selectedSheetAddress),
    [onsheet.sheets, selectedSheetAddress]
  );
  const { contract } = useSheetContract(sheet?.address);
  const [loading, setLoading] = useState<boolean>(false);

  const updateOnClick = async () => {
    setLoading(true);
    await settleTransactions([
      contract?.setImplementation(onsheet.sheetClassHash)!,
    ]);
    appendSheet({ ...sheet!, classHash: onsheet.sheetClassHash });
    setLoading(false);
  };

  const displayUpgrade = useMemo(
    () =>
      sheet?.classHash !== undefined &&
      sheet?.classHash !== 0n &&
      sheet?.classHash !== onsheet.sheetClassHash &&
      !!accountAddress &&
      BigInt(accountAddress) === sheet.owner,
    [sheet?.classHash, onsheet.sheetClassHash, accountAddress, sheet?.owner]
  );

  const [isOpenWidget, setOpenWidget] = React.useState<boolean>(false);
  return (
    <Box sx={{ display: "flex" }}>
      <GreyCell sx={{ textIndent: "20px", flex: 1 }}>
        {chainConfig.appName}
      </GreyCell>
      {displayUpgrade && (
        <Button
          sx={{
            marginLeft: `-${CELL_BORDER_WIDTH}px`,
            width: "210px",
          }}
          onClick={updateOnClick}
          variant="3"
        >
          Update
          {loading ? <LoadingDots /> : " sheet"}
        </Button>
      )}
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
