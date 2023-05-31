import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { hash, number } from "starknet";
import { N_ROW } from "../config";
import { useOnsheetContract } from "../hooks/useOnsheetContract";
import { Spreadsheet, Sheet } from "../types";
import { str2hex } from "../utils/hexUtils";
import { AbisContext } from "./AbisContext";
import { AccountContext } from "./AccountContext";
import { AppStatusContext, defaultSheetStatus } from "./AppStatusContext";

export const OnsheetContext = React.createContext<{
  onsheet: Spreadsheet;
  selectedSheetIndex?: number;
  selectedSheetAddress?: string;
  setSelectedSheetAddress: (address: string) => void;
  load: () => Promise<Sheet[]>;
  addSheet: (sheet: Omit<Sheet, "address">, owner: string) => Promise<string>;
  appendSheet: (sheet: Sheet) => void;
  validateNewSheets: () => void;
}>({
  onsheet: {
    address: "",
    sheets: [],
    defaultRenderer: "",
    sheetClassHash: "",
    proxyClassHash: "",
    sheetPrice: 0,
  },
  setSelectedSheetAddress: () => {},
  load: async () => [],
  addSheet: async () => "",
  appendSheet: () => {},
  validateNewSheets: () => {},
});

export const OnsheetContextProvider = ({
  onsheetAddress,
  children,
}: PropsWithChildren<{ onsheetAddress: string }>) => {
  const { updateAppStatus, updateSheetStatus } = useContext(AppStatusContext);
  const { accountAddress } = useContext(AccountContext);
  const { getAbiForContract } = useContext(AbisContext);
  const navigate = useNavigate();
  const [onsheet, setOnsheet] = useState<Spreadsheet>({
    address: onsheetAddress,
    sheets: [],
    defaultRenderer: "",
    sheetClassHash: "",
    proxyClassHash: "",
    sheetPrice: 0,
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
        contract.getProxyClassHash(),
        contract.getSheetPrice(),
      ])
        .then(async (response) => {
          const [renderer, sheetClassHash, proxyClassHash, sheetPrice] =
            response;
          return {
            address,
            defaultRenderer: renderer,
            sheetClassHash,
            proxyClassHash,
            sheets: [],
            sheetPrice:
              sheetPrice.div(number.toBN(10).pow(number.toBN(9))).toNumber() /
              1_000_000_000,
          };
        })
        .then((_onsheet) => {
          setOnsheet(_onsheet);
          return _onsheet.sheets;
        }),
    [address, contract]
  );

  const appendSheet = (sheet: Sheet) => {
    setOnsheet((prevOnsheet) => {
      const index = prevOnsheet.sheets.findIndex(
        (s) => s.address === sheet.address
      );
      if (index === -1) {
        return {
          ...prevOnsheet,
          sheets: [...prevOnsheet.sheets, sheet],
        };
      }
      return prevOnsheet;
    });
    updateSheetStatus(sheet.address, defaultSheetStatus);
    return address;
  };

  const addSheet = async (
    sheet: Omit<Sheet, "address">,
    owner: string
  ): Promise<string> => {
    let calldata = {
      proxyAdmin: owner,
      implementation: onsheet.sheetClassHash,
      selector: hash.getSelectorFromName("initialize"),
      calldataLen: 6,
      name: str2hex(sheet.name),
      symbol: str2hex(sheet.symbol),
      owner,
      merkleRoot: 0,
      maxPerWallet: 0,
      rendererAddress: onsheet.defaultRenderer,
    };
    const address = await contract.calculateSheetAddress(
      accountAddress,
      onsheet.proxyClassHash,
      Object.values(calldata)
    );
    const abi = await getAbiForContract(address);
    let newSheet: Sheet;
    if (Object.keys(abi).length !== 0) {
      newSheet = { ...sheet, address };
    } else {
      newSheet = { ...sheet, address, calldata, nRow: N_ROW, cellPrice: 0 };
    }
    setOnsheet((prevOnsheet) => ({
      ...prevOnsheet,
      sheets: [...prevOnsheet.sheets, newSheet],
    }));
    updateSheetStatus(address, defaultSheetStatus);
    return address;
  };

  useEffect(() => {
    if (onsheet.sheets.length > 0) {
      const lastSheet = onsheet.sheets[onsheet.sheets.length - 1];
      navigate(`/${lastSheet.address}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onsheet.sheets]);

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
      .then(() => {
        updateAppStatus({
          message: "Click on + to create a sheet",
          loading: false,
          sheets: {},
        });
      })
      .catch((e) => {
        updateAppStatus({
          message: `Error loading sheets<br /><br />${e}`,
          loading: false,
          sheets: {},
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
        appendSheet,
        validateNewSheets,
      }}
    >
      {children}
    </OnsheetContext.Provider>
  );
};
