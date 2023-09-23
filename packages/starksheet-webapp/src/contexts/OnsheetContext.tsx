import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { useChainProvider } from "../hooks";
import { useOnsheetContract } from "../hooks/useOnsheetContract";
import { chainConfig } from "../provider/chains";
import { Sheet, SheetConstructorArgs, Spreadsheet } from "../types";
import { str2hex } from "../utils/hexUtils";
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
    sheetClassHash: 0n,
    sheetPrice: 0n,
  },
  setSelectedSheetAddress: () => {},
  load: async () => [],
  addSheet: async () => "",
  appendSheet: () => {},
  validateNewSheets: () => {},
});

export const OnsheetContextProvider = ({ children }: PropsWithChildren) => {
  const { updateAppStatus, updateSheetStatus } = useContext(AppStatusContext);
  const { accountAddress } = useContext(AccountContext);
  const chainProvider = useChainProvider();
  const navigate = useNavigate();
  const [onsheet, setOnsheet] = useState<Spreadsheet>({
    address: chainConfig.addresses.spreadsheet,
    sheets: [],
    defaultRenderer: "",
    sheetClassHash: 0n,
    sheetPrice: 0n,
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
        contract.getSheetPrice(),
        contract.getSheetImplementation(),
      ])
        .then(async (response) => {
          const [renderer, sheetPrice, sheetClassHash] = response;
          return {
            address,
            defaultRenderer: renderer,
            sheetClassHash,
            sheets: [],
            sheetPrice,
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
      const sheets = [...prevOnsheet.sheets];
      if (index === -1) {
        sheets.push(sheet);
      } else {
        sheets[index] = { ...sheet };
      }
      return {
        ...prevOnsheet,
        sheets,
      };
    });
    updateSheetStatus(sheet.address, defaultSheetStatus);
    return address;
  };

  const addSheet = async (
    sheet: Omit<Sheet, "address">,
    owner: string
  ): Promise<string> => {
    let calldata: SheetConstructorArgs = {
      name: str2hex(sheet.name),
      symbol: str2hex(sheet.symbol),
      owner,
      merkleRoot: 0,
      maxPerWallet: 0,
      rendererAddress: onsheet.defaultRenderer,
    };

    const address = await contract.calculateSheetAddress(
      accountAddress,
      calldata
    );
    const addressAlreadyDeployed = await chainProvider.addressAlreadyDeployed(
      address
    );
    let newSheet: Sheet;
    if (addressAlreadyDeployed) {
      navigate(`/${address}`);
    } else {
      newSheet = { address, calldata, ...sheet };
      setOnsheet((prevOnsheet) => ({
        ...prevOnsheet,
        sheets: [...prevOnsheet.sheets, newSheet],
      }));
      updateSheetStatus(address, defaultSheetStatus);
    }
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
