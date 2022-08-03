import React, { PropsWithChildren, useEffect, useState } from "react";
import { useSheetList } from "../hooks/useSheetList";

export const CurrentSheetContext = React.createContext<{
  currentSheetAddress?: string;
  setCurrentSheetAddress: (address: string) => void;
}>({
  currentSheetAddress: undefined,
  setCurrentSheetAddress: () => {},
});

export const CurrentSheetContextProvider = ({
  children,
}: PropsWithChildren<{}>) => {
  const [currentSheetAddress, setCurrentSheetAddress] = useState<
    string | undefined
  >(undefined);

  const addresses = useSheetList();
  console.log("addresses", addresses);

  useEffect(() => {
    if (!currentSheetAddress && addresses) {
      setCurrentSheetAddress(addresses[0]);
    }
  }, [addresses, currentSheetAddress]);

  return (
    <CurrentSheetContext.Provider
      value={{ currentSheetAddress, setCurrentSheetAddress }}
    >
      {children}
    </CurrentSheetContext.Provider>
  );
};
