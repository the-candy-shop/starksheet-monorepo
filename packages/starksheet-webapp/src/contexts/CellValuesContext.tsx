import React, { PropsWithChildren } from "react";

export const CellValuesContext = React.createContext<{
  values: Record<string, string>;
  setValue: (key: string, value: string) => void;
}>({
  values: {},
  setValue: () => {},
});

export const CellValuesContextProvider = ({
  children,
}: PropsWithChildren<{}>) => {
  const [values, setValues] = React.useState<Record<string, string>>({});
  const setValue = React.useCallback(
    (key: string, value: string) => setValues({ ...values, [key]: value }),
    [setValues, values]
  );

  return (
    <CellValuesContext.Provider value={{ values, setValue }}>
      {children}
    </CellValuesContext.Provider>
  );
};
