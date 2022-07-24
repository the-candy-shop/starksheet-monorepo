import React, {PropsWithChildren, useCallback, useRef} from "react";
import { useStarkSheetContract } from "../hooks/useStarkSheetContract";
import { useStarknetCall } from "@starknet-react/core";
import { BigNumberish } from "starknet/utils/number";

export const CellValuesContext = React.createContext<{
  loading: boolean;
  hasLoaded: boolean;
  values: { owner: BigNumberish; value: BigNumberish }[];
  updateValueOwner: (id: number, owner: BigNumberish) => void;
  updateValue: (id: number, value: BigNumberish) => void;
  cellNames: string[];
  setCellNames: (value: string[]) => void;
  refresh: () => void;
}>({
  loading: false,
  hasLoaded: false,
  values: [],
  updateValueOwner: () => {},
  updateValue: () => {},
  cellNames: [],
  setCellNames: () => {},
  refresh: () => {},
});

export const CellValuesContextProvider = ({
  children,
}: PropsWithChildren<{}>) => {
  const [values, setValues] = React.useState<
    { owner: BigNumberish; value: BigNumberish }[]
  >([]);
  const previousGridData = useRef<any>(undefined);
  const [cellNames, setCellNames] = React.useState<string[]>([]);

  const { contract } = useStarkSheetContract();
  const {
    data: gridData,
    loading,
    refresh,
  } = useStarknetCall({
    contract,
    method: "renderGrid",
    args: [],
  });

  React.useEffect(() => {
    if (gridData) {
      if (previousGridData.current) {
        // @ts-ignore
        gridData.cells?.forEach((cell, index) => {
          if (previousGridData.current.cells[index].value.toString() !== cell.value.toString()) {
            console.log('fetch', index);
            fetch(`https://api-testnet.aspect.co/api/v0/asset/${contract?.address}/${index}/refresh`)
          }
        });
      }

      previousGridData.current = gridData;
      // @ts-ignore
      setValues(gridData.cells ? gridData.cells : []);
    }
  }, [contract?.address, gridData]);

  const updateValueOwner = useCallback(
    (id: number, owner: BigNumberish) => {
      const newValues = [...values];
      newValues[id] = { ...values[id], owner: owner };
      setValues(newValues);
    },
    [values]
  );

  const updateValue = useCallback(
    (id: number, value: BigNumberish) => {
      const newValues = [...values];
      newValues[id] = { ...values[id], value };
      setValues(newValues);
    },
    [values]
  );

  return (
    <CellValuesContext.Provider
      value={{
        cellNames,
        setCellNames,
        values,
        updateValueOwner,
        updateValue,
        loading,
        hasLoaded: !!gridData,
        refresh,
      }}
    >
      {children}
    </CellValuesContext.Provider>
  );
};
