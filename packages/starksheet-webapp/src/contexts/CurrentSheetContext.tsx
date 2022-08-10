import React, { PropsWithChildren, useEffect, useState } from "react";

export const CurrentSheetContext = React.createContext<{
  addresses: string[];
  setAddresses: (addresses: string[]) => void;
  currentSheetAddress?: string;
  setCurrentSheetAddress: (address: string) => void;
}>({
  addresses: [],
  setAddresses: () => {},
  currentSheetAddress: undefined,
  setCurrentSheetAddress: () => {},
});

export const CurrentSheetContextProvider = ({
  children,
}: PropsWithChildren<{}>) => {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [currentSheetAddress, setCurrentSheetAddress] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    if (!currentSheetAddress && addresses.length > 0) {
      setCurrentSheetAddress(addresses[0]);
    }
  }, [addresses, currentSheetAddress]);

  return (
    <CurrentSheetContext.Provider
      value={{
        currentSheetAddress,
        setCurrentSheetAddress,
        addresses,
        setAddresses,
      }}
    >
      {children}
    </CurrentSheetContext.Provider>
  );
};
