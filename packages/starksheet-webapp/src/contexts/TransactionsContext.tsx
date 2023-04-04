import { getStarknet } from "get-starknet";
import { useSnackbar } from "notistack";
import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { Call, stark } from "starknet";
import { toBN } from "starknet/utils/number";
import { chainProvider } from "../provider";
import { NewSheet } from "../types";
import { AccountContext } from "./AccountContext";
import { CellValuesContext } from "./CellValuesContext";
import { OnsheetContext } from "./OnsheetContext";

export const TransactionsContext = React.createContext<{
  transactions: Call[];
  settleTransactions: (tx?: Call[]) => Promise<void>;
}>({
  transactions: [],
  settleTransactions: async () => {},
});

export const TransactionsContextProvider = ({
  children,
}: PropsWithChildren<{}>) => {
  const { accountAddress, proof } = useContext(AccountContext);
  const { updatedValues, setUpdatedValues } = useContext(CellValuesContext);
  const { onsheet, validateNewSheets } = useContext(OnsheetContext);
  const { enqueueSnackbar } = useSnackbar();

  const newSheetsTransactions = useMemo(() => {
    return onsheet.sheets
      .filter((sheet): sheet is NewSheet => sheet.calldata !== undefined)
      .map((sheet) => ({
        contractAddress: onsheet.address,
        entrypoint: "addSheet",
        calldata: stark.compileCalldata({
          name: sheet.calldata.name.toString(),
          symbol: sheet.calldata.symbol.toString(),
          proof,
        }),
      }));
  }, [onsheet, proof]);

  const cellsTransactions = useMemo(() => {
    return Object.entries(updatedValues)
      .map(([sheetAddress, sheetUpdatedValues]) => {
        return Object.entries(sheetUpdatedValues).map(([tokenId, cell]) => ({
          ...cell,
          tokenId,
          sheetAddress,
        }));
      })
      .reduce((prev, cur) => [...prev, ...cur], [])
      .filter(
        (cell) =>
          (cell.owner.eq(toBN(0)) && !cell.selector.eq(toBN(0))) ||
          "0x" + cell.owner.toString(16) === accountAddress
      )
      .map((cell) =>
        cell.owner.eq(toBN(0))
          ? {
              contractAddress: cell.sheetAddress,
              entrypoint: "mintAndSetPublic",
              calldata: stark.compileCalldata({
                tokenId: {
                  type: "struct",
                  low: cell.tokenId,
                  high: 0,
                },
                proof,
                contractAddress: cell.contractAddress.toString(),
                value: cell.selector.toString(),
                cellCalldata: cell.calldata.map((d) => d.toString()),
              }),
            }
          : {
              contractAddress: cell.sheetAddress,
              entrypoint: "setCell",
              calldata: stark.compileCalldata({
                tokenId: cell.tokenId,
                contractAddress: cell.contractAddress.toString(),
                value: cell.selector.toString(),
                cellCalldata: cell.calldata.map((d) => d.toString()),
              }),
            }
      );
  }, [accountAddress, proof, updatedValues]);

  const transactions = useMemo(
    () => [...newSheetsTransactions, ...cellsTransactions],
    [newSheetsTransactions, cellsTransactions]
  );

  const settleTransactions = useCallback(
    async (otherTransactions?: Call[]) => {
      const _otherTxs =
        otherTransactions === undefined ? [] : otherTransactions;
      return await getStarknet()
        .account.execute([...transactions, ..._otherTxs])
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
    [setUpdatedValues, validateNewSheets, enqueueSnackbar, transactions]
  );

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        settleTransactions,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
};
