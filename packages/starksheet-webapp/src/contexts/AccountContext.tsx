import { getStarknet } from "get-starknet";
import React, { PropsWithChildren, useMemo, useState } from "react";
import starksheetContractData from "../contract.json";

export const AccountContext = React.createContext<{
  accountAddress: string;
  setAccountAddress: (address: string) => void;
  proof: string[];
}>({
  accountAddress: "",
  setAccountAddress: () => {},
  proof: [],
});

export const AccountContextProvider = ({ children }: PropsWithChildren<{}>) => {
  const [accountAddress, setAccountAddress] = useState<string>(
    getStarknet().account.address
  );

  const proof = useMemo(
    () =>
      (starksheetContractData.allowlist as { [address: string]: string[] })[
        accountAddress
      ] || [],
    [accountAddress]
  );

  return (
    <AccountContext.Provider
      value={{
        accountAddress,
        setAccountAddress,
        proof,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};
