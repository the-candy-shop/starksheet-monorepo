import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { starknetRpcProvider } from "../provider";
import { Sheet, Starksheet } from "../types";
import { hex2str } from "../utils/hexUtils";
import { AppStatusContext } from "./AppStatusContext";

export const StarksheetContext = React.createContext<{
  starksheet: Starksheet;
  selectedSheet?: number;
  setSelectedSheet: (index: number) => void;
  updateSheets: () => Promise<void>;
  addSheet: (sheet: Sheet) => void;
}>({
  starksheet: { address: "", sheets: [] },
  setSelectedSheet: () => {},
  updateSheets: async () => {},
  addSheet: () => {},
});

export const StarksheetContextProvider = ({
  starksheetAddress,
  children,
}: PropsWithChildren<{ starksheetAddress: string }>) => {
  const { updateAppStatus } = useContext(AppStatusContext);
  const [starksheet, setStarksheet] = useState<Starksheet>({
    address: starksheetAddress,
    sheets: [],
  });
  const [selectedSheet, setSelectedSheet] = useState<number>();
  const { address } = starksheet;

  const updateSheets = useCallback(
    () =>
      starknetRpcProvider
        .callContract({
          contractAddress: address,
          entrypoint: "getSheets",
        })
        .then(async (response) => {
          const sheets = response.result.slice(1);
          const names = await Promise.all(
            sheets.map((sheet) =>
              starknetRpcProvider
                .callContract({
                  contractAddress: sheet,
                  entrypoint: "name",
                })
                .then((response) => response.result[0])
            )
          );
          return names.map(
            (name, index) =>
              ({
                address: sheets[index],
                name: hex2str(name),
              } as Sheet)
          );
        })
        .then((sheets) => {
          setStarksheet({ address, sheets });
        }),
    [address]
  );

  const addSheet = (sheet: Sheet) => {
    setStarksheet({ address, sheets: [...starksheet.sheets, sheet] });
  };

  useEffect(() => {
    updateSheets().then(() => {
      updateAppStatus({
        message: "Click on a tab to open a sheet",
        loading: false,
      });
    });
    // eslint-disable-next-line
  }, [updateSheets]);

  return (
    <StarksheetContext.Provider
      value={{
        starksheet,
        selectedSheet,
        setSelectedSheet,
        updateSheets,
        addSheet,
      }}
    >
      {children}
    </StarksheetContext.Provider>
  );
};
