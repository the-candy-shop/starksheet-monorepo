import React, { PropsWithChildren, useCallback } from "react";
import { useStarkSheetContract } from "../hooks/useStarkSheetContract";
import { useStarknetCall } from "@starknet-react/core";
import { BigNumberish } from "starknet/utils/number";

export const CellValuesContext = React.createContext<{
  loading: boolean;
  hasLoaded: boolean;
  values: { owner: BigNumberish; value: BigNumberish }[];
  updateValueOwner: (id: number, owner: BigNumberish) => void;
  updateValue: (id: number, value: BigNumberish) => void;
}>({
  loading: false,
  hasLoaded: false,
  values: [],
  updateValueOwner: () => {},
  updateValue: () => {},
});

export const CellValuesContextProvider = ({
  children,
}: PropsWithChildren<{}>) => {
  const [values, setValues] = React.useState<
    { owner: BigNumberish; value: BigNumberish }[]
  >([]);

  const { contract } = useStarkSheetContract();
  const { data: gridData, loading } = useStarknetCall({
    contract,
    method: "renderGrid",
    args: [],
  });

  React.useEffect(() => {
    if (gridData) {
      // @ts-ignore
      setValues(gridData.cells ? gridData.cells : []);
    }
  }, [gridData]);

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
        values,
        updateValueOwner,
        updateValue,
        loading,
        hasLoaded: !!gridData,
      }}
    >
      {children}
    </CellValuesContext.Provider>
  );
};
