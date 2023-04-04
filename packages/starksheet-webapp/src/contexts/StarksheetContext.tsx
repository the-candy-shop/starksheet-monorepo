import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { calculateContractAddressFromHash } from "starknet/dist/utils/hash";
import { useStarksheetContract } from "../hooks/useStarksheetContract";
import { chainProvider } from "../provider";
import { Sheet, Starksheet } from "../types";
import {
  bn2hex,
  hex2str,
  normalizeHexString,
  str2hex,
} from "../utils/hexUtils";
import { AppStatusContext, defaultSheetStatus } from "./AppStatusContext";

export const StarksheetContext = React.createContext<{
  starksheet: Starksheet;
  selectedSheet?: number;
  selectedSheetAddress?: string;
  setSelectedSheet: (index: number) => void;
  load: () => Promise<Sheet[]>;
  addSheet: (sheet: Omit<Sheet, "address">, owner: string) => void;
  validateNewSheets: () => void;
}>({
  starksheet: {
    address: "",
    sheets: [],
    defaultRenderer: "",
    sheetClassHash: "",
  },
  setSelectedSheet: () => {},
  load: async () => [],
  addSheet: () => {},
  validateNewSheets: () => {},
});

export const StarksheetContextProvider = ({
  starksheetAddress,
  children,
}: PropsWithChildren<{ starksheetAddress: string }>) => {
  const { updateAppStatus, updateSheetStatus } = useContext(AppStatusContext);
  const [starksheet, setStarksheet] = useState<Starksheet>({
    address: starksheetAddress,
    sheets: [],
    defaultRenderer: "",
    sheetClassHash: "",
  });
  const [selectedSheet, setSelectedSheet] = useState<number>();
  const { address, sheets } = starksheet;
  const { contract } = useStarksheetContract();

  const selectedSheetAddress = useMemo(
    () =>
      selectedSheet !== undefined ? sheets[selectedSheet].address : undefined,
    [sheets, selectedSheet]
  );

  const load = useCallback(
    () =>
      Promise.all([
        contract.functions["getSheetDefaultRendererAddress"](),
        contract.functions["getSheetClassHash"](),
        contract.functions["getSheets"](),
      ])
        .then(async (response) => {
          const [renderer, classHash, { addresses }] = response;
          const names = await Promise.all(
            addresses.map((sheet) =>
              chainProvider
                .callContract({
                  contractAddress: bn2hex(sheet),
                  entrypoint: "name",
                })
                .then((response) => normalizeHexString(response.result[0]))
            )
          );
          const symbols = await Promise.all(
            addresses.map((sheet) =>
              chainProvider
                .callContract({
                  contractAddress: bn2hex(sheet),
                  entrypoint: "symbol",
                })
                .then((response) => normalizeHexString(response.result[0]))
            )
          );
          return {
            address,
            defaultRenderer: bn2hex(renderer.address),
            sheetClassHash: bn2hex(classHash.hash),
            sheets: names.map(
              (name, index) =>
                ({
                  address: bn2hex(addresses[index]),
                  name: hex2str(name),
                  symbol: hex2str(symbols[index]),
                } as Sheet)
            ),
          };
        })
        .then((_starksheet) => {
          setStarksheet(_starksheet);
          return _starksheet.sheets;
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
      rendererAddress: starksheet.defaultRenderer,
    };
    const address = calculateContractAddressFromHash(
      sheets.length,
      starksheet.sheetClassHash,
      Object.values(calldata),
      starksheet.address
    );
    setStarksheet((prevStarksheet) => ({
      ...prevStarksheet,
      sheets: [...prevStarksheet.sheets, { ...sheet, address, calldata }],
    }));
    updateSheetStatus(address, defaultSheetStatus);
    setSelectedSheet(starksheet.sheets.length);
  };

  const validateNewSheets = () => {
    setStarksheet((prevStarksheet) => ({
      ...prevStarksheet,
      sheets: prevStarksheet.sheets.map((sheet) => {
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
    <StarksheetContext.Provider
      value={{
        starksheet,
        selectedSheet,
        selectedSheetAddress,
        setSelectedSheet,
        load,
        addSheet,
        validateNewSheets,
      }}
    >
      {children}
    </StarksheetContext.Provider>
  );
};
