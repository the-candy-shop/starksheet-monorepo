import React, { PropsWithChildren, useCallback, useRef } from "react";
import { useStarkSheetContract } from "../hooks/useStarkSheetContract";
import { BigNumberish, toBN } from "starknet/utils/number";
import { Contract } from "starknet";

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

type CellData = { owner: BigNumberish; value: BigNumberish };

export const CellValuesContextProvider = ({
  children,
}: PropsWithChildren<{}>) => {
  const [values, setValues] = React.useState<CellData[]>([]);
  const previousGridData = useRef<any>(undefined);
  const [cellNames, setCellNames] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [hasLoaded, setHasLoaded] = React.useState<boolean>(false);
  const { contract } = useStarkSheetContract();

  const refreshAspect = useCallback(
    (cells: CellData[]) => {
      if (previousGridData.current) {
        cells.forEach((cell, index) => {
          if (
            previousGridData.current[index]?.value?.toString() !==
            cell?.value?.toString()
          ) {
            fetch(
              `https://api-testnet.aspect.co/api/v0/asset/${contract?.address}/${index}/refresh`
            );
          }
        });
      }
      previousGridData.current = cells;
    },
    [contract?.address]
  );

  const load = useCallback(
    (contract: Contract) => {
      setLoading(true);
      return contract
        .call("renderGrid", [])
        .then((gridData) => {
          refreshAspect(gridData.cells);
          setValues(gridData.cells);
          setHasLoaded(true);
        })
        .finally(() => setLoading(false));
    },
    [refreshAspect]
  );

  const refresh = useCallback(async () => {
    if (contract) {
      return load(contract);
    }
  }, [contract, load]);

  React.useEffect(() => {
    if (contract) {
      load(contract);
    }
  }, [contract, load]);

  const updateValueOwner = useCallback(
    (id: number, owner: BigNumberish) => {
      const newValues = [...values];
      newValues[id] = {
        owner: owner,
        value: values[id]?.value || toBN(0),
      };
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
        hasLoaded,
        refresh,
      }}
    >
      {children}
    </CellValuesContext.Provider>
  );
};
