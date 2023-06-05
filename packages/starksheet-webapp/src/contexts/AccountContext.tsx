import { BigNumberish } from "ethers";
import { useSnackbar } from "notistack";
import React, { PropsWithChildren, useMemo, useState } from "react";
import { Call, InvokeFunctionResponse } from "starknet";
import onsheetContractData from "../contract.json";
import { useChainProvider } from "../hooks";
import { StarknetProvider } from "../provider/StarknetProvider";

export const AccountContext = React.createContext<{
  accountAddress: string;
  setAccountAddress: (address: string) => void;
  connect: () => Promise<void>;
  execute: (
    calls: Call[],
    options?: { value?: BigNumberish }
  ) => Promise<InvokeFunctionResponse>;
  proof: string[];
}>({
  accountAddress: "",
  setAccountAddress: () => {},
  connect: async () => {},
  execute: async () => ({ transaction_hash: "" }),
  proof: [],
});

export const AccountContextProvider = ({ children }: PropsWithChildren<{}>) => {
  const [accountAddress, setAccountAddress] = useState<string>("");
  const { enqueueSnackbar } = useSnackbar();

  const proof = useMemo(
    () =>
      (onsheetContractData.allowlist as { [address: string]: string[] })[
        accountAddress
      ] || [],
    [accountAddress]
  );

  const provider = useChainProvider() as StarknetProvider;
  const execute = provider.execute;

  const connect = () => provider.login()
    .then((address) => {
      setAccountAddress(address);
    })
    .catch((error) => {
      enqueueSnackbar(error.toString(), { variant: "warning" })
    });

  return (
    <AccountContext.Provider
      value={{
        accountAddress,
        setAccountAddress,
        connect,
        execute,
        proof,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};
