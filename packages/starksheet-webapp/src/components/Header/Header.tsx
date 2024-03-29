import { Box } from "@mui/material";
import { useSnackbar } from "notistack";
import { useContext, useMemo, useState } from "react";
import { CELL_BORDER_WIDTH, N_ROW } from "../../config";
import { AccountContext } from "../../contexts/AccountContext";
import { CellValuesContext } from "../../contexts/CellValuesContext";
import { OnsheetContext } from "../../contexts/OnsheetContext";
import { TransactionsContext } from "../../contexts/TransactionsContext";
import { useSheetContract } from "../../hooks";
import { chainConfig } from "../../provider/chains";
import { RC_BOUND } from "../../utils/constants";
import Button from "../Button/Button";
import ConnectButton from "../ConnectButton/ConnectButton";
import GreyCell from "../GreyCell/GreyCell";
import LoadingDots from "../LoadingDots/LoadingDots";

function Header() {
  const { onsheet, selectedSheetAddress, appendSheet, addSheet } =
    useContext(OnsheetContext);
  const { accountAddress } = useContext(AccountContext);
  const { settleTransactions, addSendEth } = useContext(TransactionsContext);
  const sheet = useMemo(
    () =>
      onsheet.sheets.find((sheet) => sheet.address === selectedSheetAddress),
    [onsheet.sheets, selectedSheetAddress],
  );
  const { contract } = useSheetContract(sheet?.address);
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState<boolean>(false);
  const { values, setValues, updateCells } = useContext(CellValuesContext);

  const updateOnClick = async () => {
    setLoading(true);
    await settleTransactions([
      contract?.setImplementation(onsheet.sheetClassHash)!,
    ]);
    appendSheet({ ...sheet!, classHash: onsheet.sheetClassHash });
    setLoading(false);
  };

  const copyOnClick = async () => {
    if (!accountAddress) {
      enqueueSnackbar(`Connect your wallet to use ${chainConfig.appName}`, {
        variant: "info",
      });
      return;
    }
    const address = await addSheet(
      {
        name: `${sheet?.name} copy`,
        symbol: `${sheet?.symbol} copy`,
        nRow: N_ROW,
        cellPrice: 0n,
        sheetPrice: 0n,
      },
      accountAddress,
    );
    setValues((prevValues) => ({
      ...prevValues,
      [address]: values[sheet?.address!],
    }));
    addSendEth({
      recipientAddress: BigInt(accountAddress),
      amount: sheet?.sheetPrice!,
    });
  };

  const fillOnClick = () => {
    const newValues = values[sheet?.address!]
      .filter((cell) => cell.value === 0n && cell.owner === 0n)
      .map((cell) => {
        const value = BigInt(Math.floor(Math.random() * 255)) + 1n;
        return {
          ...cell,
          contractAddress: RC_BOUND,
          selector: value,
          value,
          calldata: [],
        };
      });
    updateCells(newValues);
  };

  const displayUpgrade = useMemo(
    () =>
      sheet?.classHash !== undefined &&
      sheet?.classHash !== 0n &&
      sheet?.classHash !== onsheet.sheetClassHash &&
      !!accountAddress &&
      BigInt(accountAddress) === sheet.owner,
    [sheet?.classHash, onsheet.sheetClassHash, accountAddress, sheet?.owner],
  );

  const learnMoreButton = (
    <Button
      sx={{ marginLeft: `-${CELL_BORDER_WIDTH}px`, width: "191px" }}
      onClick={() =>
        window.open(
          "https://starksheet.notion.site/starksheet/Starksheet-bfb55bc581e446598d7bf5860e219b03",
          "_blank",
        )
      }
    >
      Learn more
    </Button>
  );
  const upgradeButton = (
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
  );
  const copySheetButton = (
    <Button
      sx={{
        marginLeft: `-${CELL_BORDER_WIDTH}px`,
        width: "210px",
      }}
      onClick={copyOnClick}
      variant="1"
    >
      Copy sheet
    </Button>
  );
  const fillSheetButton = (
    <Button
      sx={{
        marginLeft: `-${CELL_BORDER_WIDTH}px`,
        width: "210px",
      }}
      onClick={fillOnClick}
      variant="1"
    >
      Fill sheet
    </Button>
  );
  return (
    <Box sx={{ display: "flex" }}>
      <GreyCell sx={{ textIndent: "20px", flex: 1 }}>
        {chainConfig.appName}
      </GreyCell>
      {displayUpgrade && upgradeButton}
      {!!sheet && copySheetButton}
      {!!sheet && fillSheetButton}
      {learnMoreButton}
      <ConnectButton sx={{ marginLeft: `-${CELL_BORDER_WIDTH}px` }} />
    </Box>
  );
}

export default Header;
