import { useSnackbar } from "notistack";
import React, { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { BigNumberish } from "starknet";
import { useChainProvider } from "../hooks";
import { ContractCall, TransactionResponse } from "../types";

export const AccountContext = React.createContext<{
  accountAddress: string;
  accountDomain: string;
  setAccountAddress: (address: string) => void;
  connect: () => Promise<void>;
  execute: (
    calls: ContractCall[],
    options?: { value?: number | string },
  ) => Promise<TransactionResponse>;
  proof: string[];
}>({
  accountAddress: "",
  accountDomain: "",
  setAccountAddress: () => {},
  connect: async () => {},
  execute: async () => ({ transaction_hash: "" }),
  proof: [],
});

export const AccountContextProvider = ({ children }: PropsWithChildren<{}>) => {
  const [accountAddress, setAccountAddress] = useState<string>("");
  const [accountDomain, setAccountDomain] = useState<string>("");
  const { enqueueSnackbar } = useSnackbar();

  const proof = useMemo(() => [], []);

  const provider = useChainProvider();
  useEffect(() => {
    provider.resolveAddress(accountAddress).then((resolved) => {
      setAccountDomain(resolved);
    });
  }, [provider, accountAddress]);

  const connect = () =>
    provider
      .login()
      .then((address) => {
        setAccountAddress(address);
      })
      .catch((error) => {
        enqueueSnackbar(error.toString(), { variant: "warning" });
      });

  const execute = (calls: ContractCall[], options?: { value?: BigNumberish }) =>
    // @ts-ignore
    provider.execute(calls, options);

  return (
    <AccountContext.Provider
      value={{
        accountAddress,
        accountDomain,
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
