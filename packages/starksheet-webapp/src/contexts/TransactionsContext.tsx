import { useSnackbar } from "notistack";
import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { Call, number } from "starknet";
import { useOnsheetContract } from "../hooks/useOnsheetContract";
import { chainProvider } from "../provider";
import { NewSheet } from "../types";
import { AccountContext } from "./AccountContext";
import { CellValuesContext } from "./CellValuesContext";
import { OnsheetContext } from "./OnsheetContext";

export const TransactionsContext = React.createContext<{
  transactions: Call[];
  newSheetsTransactions: Call[];
  settleTransactions: (tx?: Call[]) => Promise<void>;
}>({
  transactions: [],
  newSheetsTransactions: [],
  settleTransactions: async () => {},
});

export const TransactionsContextProvider = ({
  children,
}: PropsWithChildren<{}>) => {
  const { accountAddress, execute } = useContext(AccountContext);
  const { updatedValues, setUpdatedValues } = useContext(CellValuesContext);
  const { onsheet, validateNewSheets } = useContext(OnsheetContext);
  const { contract } = useOnsheetContract();
  const { enqueueSnackbar } = useSnackbar();

  const newSheetsTransactions = useMemo(() => {
    return onsheet.sheets
      .filter((sheet): sheet is NewSheet => sheet.calldata !== undefined)
      .map((sheet) =>
        contract.addSheetTxBuilder(
          sheet.calldata.name.toString(),
          sheet.calldata.symbol.toString()
        )
      );
  }, [onsheet, contract]);

  const cellsTransactions = useMemo(() => {
    return Object.entries(updatedValues)
      .map(([sheetAddress, sheetUpdatedValues]) => {
        return Object.entries(sheetUpdatedValues).map(([tokenId, cell]) => ({
          ...cell,
          tokenId: parseInt(tokenId),
          sheetAddress,
        }));
      })
      .reduce((prev, cur) => [...prev, ...cur], [])
      .filter(
        (cell) =>
          (cell.owner.eq(number.toBN(0)) &&
            !cell.selector.eq(number.toBN(0))) ||
          "0x" + cell.owner.toString(16) === accountAddress
      )
      .map((cell) => contract.setCellTxBuilder(cell));
  }, [accountAddress, updatedValues, contract]);

  const transactions = useMemo(
    () => [...newSheetsTransactions, ...cellsTransactions],
    [newSheetsTransactions, cellsTransactions]
  );

  const settleTransactions = useCallback(
    async (otherTransactions?: Call[]) => {
      const _otherTxs =
        otherTransactions === undefined ? [] : otherTransactions;
      let options;
      if (newSheetsTransactions.length > 0) {
        const sheetPrice = await contract.getSheetPrice();
        options = {
          value: sheetPrice
            .mul(number.toBN(newSheetsTransactions.length))
            .toString(),
        };
      }

      return execute(
        [...newSheetsTransactions, ...cellsTransactions, ..._otherTxs],
        options
      )
        .then(async (response) => {
          await chainProvider.waitForTransaction(response.transaction_hash);
          return chainProvider.getTransactionReceipt(response.transaction_hash);
        })
        .then(async (receipt) => {
          if (receipt.status !== "REJECTED") {
            setUpdatedValues({});
            validateNewSheets();
          }
          return receipt;
        })
        .then((receipt) => {
          enqueueSnackbar(
            `Transaction ${receipt.transaction_hash} finalized with status ${receipt.status}`,
            { variant: "info" }
          );
        })
        .catch((error: any) => {
          enqueueSnackbar(error.toString(), { variant: "error" });
        });
    },
    [
      setUpdatedValues,
      validateNewSheets,
      enqueueSnackbar,
      newSheetsTransactions,
      cellsTransactions,
      execute,
      contract,
    ]
  );

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        newSheetsTransactions,
        settleTransactions,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
};
