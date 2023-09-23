import { useSnackbar } from "notistack";
import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useChainProvider } from "../hooks/useChainProvider";
import { useOnsheetContract } from "../hooks/useOnsheetContract";
import { ContractCall, NewSheet } from "../types";
import { AccountContext } from "./AccountContext";
import { CellValuesContext } from "./CellValuesContext";
import { OnsheetContext } from "./OnsheetContext";

export const TransactionsContext = React.createContext<{
  transactions: ContractCall[];
  newSheetsTransactions: ContractCall[];
  settleTransactions: (tx?: ContractCall[]) => Promise<void>;
  costEth: number;
  addSendEth: (tx: { recipientAddress: bigint; amount: bigint }) => void;
}>({
  transactions: [],
  newSheetsTransactions: [],
  settleTransactions: async () => {},
  costEth: 0,
  addSendEth: () => {},
});

export const TransactionsContextProvider = ({
  children,
}: PropsWithChildren<{}>) => {
  const { accountAddress, execute } = useContext(AccountContext);
  const { updatedValues, setUpdatedValues } = useContext(CellValuesContext);
  const { onsheet, validateNewSheets } = useContext(OnsheetContext);
  const { contract } = useOnsheetContract();
  const { enqueueSnackbar } = useSnackbar();
  const chainProvider = useChainProvider();
  const [sendEth, setSendEth] = useState<
    { recipientAddress: bigint; amount: bigint }[]
  >([]);

  const addSendEth = (tx: { recipientAddress: bigint; amount: bigint }) => {
    setSendEth((prev) => [...prev, tx]);
  };

  const newSheetsTransactions = useMemo(() => {
    return onsheet.sheets
      .filter((sheet): sheet is NewSheet => sheet.calldata !== undefined)
      .map((sheet) =>
        contract.addSheetTxBuilder(
          sheet.calldata.name.toString(),
          sheet.calldata.symbol.toString(),
          accountAddress
        )
      );
  }, [onsheet, contract, accountAddress]);

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
          (cell.owner === 0n && cell.selector !== 0n) ||
          "0x" + cell.owner.toString(16) === accountAddress
      )
      .map((cell) => contract.setCellTxBuilder(cell));
  }, [accountAddress, updatedValues, contract]);

  const transactions = useMemo(
    () => [...newSheetsTransactions, ...cellsTransactions],
    [newSheetsTransactions, cellsTransactions]
  );

  const costEth = useMemo(() => {
    return (
      (newSheetsTransactions.length * Number(onsheet.sheetPrice / 10n ** 9n)) /
        10 ** 9 +
      cellsTransactions
        .filter((tx) => tx.entrypoint === "mintAndSetPublic")
        .map(
          (tx) =>
            onsheet.sheets.find((s) => s.address === tx.to)?.cellPrice || 0n
        )
        .reduce((a, b) => a + Number(b / 10n ** 9n) / 10 ** 9, 0) +
      sendEth
        .map((tx) => Number(tx.amount / 10n ** 9n) / 10 ** 9)
        .reduce((a, b) => a + b, 0)
    );
  }, [
    newSheetsTransactions,
    onsheet.sheetPrice,
    onsheet.sheets,
    cellsTransactions,
    sendEth,
  ]);

  const settleTransactions = useCallback(
    async (otherTransactions?: ContractCall[]) => {
      const _otherTxs =
        otherTransactions === undefined ? [] : otherTransactions;
      let options = {};
      if (costEth > 0) {
        if (newSheetsTransactions.length > 0) {
          options = {
            [onsheet.address]: {
              value: BigInt(newSheetsTransactions.length) * onsheet.sheetPrice,
            },
          };
        }
        const cellsCost = cellsTransactions
          .filter((tx) => tx.entrypoint === "mintAndSetPublic")
          .map((tx) => ({
            ...tx,
            cellPrice: onsheet.sheets.find((s) => s.address === tx.to)
              ?.cellPrice!,
          }))
          .filter((tx) => tx.cellPrice > 0)
          .reduce(
            (prev, tx) => ({
              ...prev,
              [tx.to]: {
                value: (prev[tx.to]?.value || 0n) + tx.cellPrice,
              },
            }),
            {} as { [address: string]: { value?: bigint } }
          );
        options = {
          ...options,
          ...cellsCost,
        };
      }

      const sendEthTxs = sendEth.map((tx) =>
        chainProvider.sendEthTxBuilder(tx.recipientAddress, tx.amount)
      );
      return execute(
        [
          ...sendEthTxs,
          ...newSheetsTransactions,
          ...cellsTransactions,
          ..._otherTxs,
        ],
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
            setSendEth([]);
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
          console.log("error", error.toString());
          if (error.toString() === "Error: Execute failed") {
            // TODO: fix because braavos raises while it does work
            setUpdatedValues({});
            validateNewSheets();
          } else {
            enqueueSnackbar(error.toString(), { variant: "error" });
          }
        });
    },
    [
      setUpdatedValues,
      validateNewSheets,
      enqueueSnackbar,
      newSheetsTransactions,
      cellsTransactions,
      execute,
      chainProvider,
      costEth,
      onsheet.address,
      onsheet.sheetPrice,
      onsheet.sheets,
      sendEth,
    ]
  );

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        newSheetsTransactions,
        settleTransactions,
        costEth,
        addSendEth,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
};
