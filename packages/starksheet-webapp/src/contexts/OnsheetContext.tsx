import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useOnsheetContract } from "../hooks/useOnsheetContract";
import { chainProvider } from "../provider";
import { Onsheet, Sheet } from "../types";
import { hex2str, normalizeHexString, str2hex } from "../utils/hexUtils";
import { AppStatusContext, defaultSheetStatus } from "./AppStatusContext";

export const OnsheetContext = React.createContext<{
  onsheet: Onsheet;
  selectedSheetIndex?: number;
  selectedSheetAddress?: string;
  setSelectedSheetAddress: (address: string) => void;
  load: () => Promise<Sheet[]>;
  addSheet: (sheet: Omit<Sheet, "address">, owner: string) => void;
  validateNewSheets: () => void;
}>({
  onsheet: {
    address: "",
    sheets: [],
    defaultRenderer: "",
    sheetClassHash: "",
  },
  setSelectedSheetAddress: () => {},
  load: async () => [],
  addSheet: () => {},
  validateNewSheets: () => {},
});

export const OnsheetContextProvider = ({
  onsheetAddress,
  children,
}: PropsWithChildren<{ onsheetAddress: string }>) => {
  const { updateAppStatus, updateSheetStatus } = useContext(AppStatusContext);
  const [onsheet, setOnsheet] = useState<Onsheet>({
    address: onsheetAddress,
    sheets: [],
    defaultRenderer: "",
    sheetClassHash: "",
  });

  const [selectedSheetAddress, setSelectedSheetAddress] = useState<string>();
  const { address, sheets } = onsheet;
  const { contract } = useOnsheetContract();

  const selectedSheetIndex = useMemo(() => {
    const index = sheets.findIndex(
      (sheet) => sheet.address === selectedSheetAddress
    );
    return index > -1 ? index : undefined;
  }, [sheets, selectedSheetAddress]);

  const load = useCallback(
    () =>
      Promise.all([
        contract.getSheetDefaultRendererAddress(),
        contract.getSheetClassHash(),
        contract.getSheets(),
      ])
        .then(async (response) => {
          const [renderer, classHash, addresses] = response;
          const names = await Promise.all(
            addresses.map((sheet) =>
              chainProvider
                .callContract({
                  contractAddress: sheet,
                  entrypoint: "name",
                })
                .then((response) => normalizeHexString(response.result[0]))
            )
          );
          const symbols = await Promise.all(
            addresses.map((sheet) =>
              chainProvider
                .callContract({
                  contractAddress: sheet,
                  entrypoint: "symbol",
                })
                .then((response) => normalizeHexString(response.result[0]))
            )
          );
          return {
            address,
            defaultRenderer: renderer,
            sheetClassHash: classHash,
            sheets: names.map(
              (name, index) =>
                ({
                  address: addresses[index],
                  name: hex2str(name),
                  symbol: hex2str(symbols[index]),
                } as Sheet)
            ),
          };
        })
        .then((_onsheet) => {
          setOnsheet(_onsheet);
          return _onsheet.sheets;
        }),
    [address, contract]
  );

  const addSheet = (sheet: Omit<Sheet, "address">, owner: string) => {
    const calldata = {
      name: str2hex(sheet.name),
      symbol: str2hex(sheet.symbol),
      owner,
      merkleRoot: 0,
      maxPerWallet: 0,
      rendererAddress: onsheet.defaultRenderer,
    };
    const address = contract.calculateSheetAddress(
      sheets.length,
      onsheet.sheetClassHash,
      Object.values(calldata),
      onsheet.address
    );
    setOnsheet((prevOnsheet) => ({
      ...prevOnsheet,
      sheets: [...prevOnsheet.sheets, { ...sheet, address, calldata }],
    }));
    updateSheetStatus(address, defaultSheetStatus);
    setSelectedSheetAddress(address);
  };

  const validateNewSheets = () => {
    setOnsheet((prevOnsheet) => ({
      ...prevOnsheet,
      sheets: prevOnsheet.sheets.map((sheet) => {
        delete sheet.calldata;
        return sheet;
      }),
    }));
  };

  useEffect(() => {
    load()
      .then((sheets) => {
        updateAppStatus({
          message: "Click on a tab to open a sheet",
          loading: false,
          sheets: sheets.reduce(
            (prev, cur) => ({
              ...prev,
              [cur.address]: defaultSheetStatus,
            }),
            {}
          ),
        });
      })
      .catch((e) => {
        updateAppStatus({
          message: `Error loading sheets<br /><br />${e}`,
          loading: false,
          sheets: sheets.reduce(
            (prev, cur) => ({
              ...prev,
              [cur.address]: defaultSheetStatus,
            }),
            {}
          ),
        });
      });
    // Disable missing updateAppStatus
    // eslint-disable-next-line
  }, [load]);

  return (
    <OnsheetContext.Provider
      value={{
        onsheet,
        selectedSheetIndex,
        selectedSheetAddress,
        setSelectedSheetAddress,
        load,
        addSheet,
        validateNewSheets,
      }}
    >
      {children}
    </OnsheetContext.Provider>
  );
};
