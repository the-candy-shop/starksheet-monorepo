import { BigNumberish } from "ethers";
import { disconnect, connect as getStarknet } from "get-starknet";
import { useSnackbar } from "notistack";
import React, { PropsWithChildren, useMemo, useState } from "react";
import { Call, InvokeFunctionResponse, number, stark } from "starknet";
import onsheetContractData from "../contract.json";
import { chainId } from "../provider";
import { hex2str, normalizeHexString } from "../utils/hexUtils";

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

  const connect = async () => {
    let starknetWindow = await getStarknet({ modalMode: "neverAsk" });
    if (starknetWindow?.isConnected) {
      await disconnect({ clearLastWallet: true });
      setAccountAddress("");
    }
    starknetWindow = await getStarknet({ modalMode: "canAsk" });
    if (starknetWindow === null) {
      return;
    }
    if (starknetWindow.isConnected === false) {
      return;
    }

    if (chainId !== hex2str(starknetWindow.provider.chainId)) {
      if (starknetWindow.id === "argentX") {
        starknetWindow.request({
          type: "wallet_switchStarknetChain",
          params: { chainId },
        });
      } else {
        enqueueSnackbar(
          `Wrong network detected: "${hex2str(
            starknetWindow.provider.chainId
          )}" instead of "${chainId}"`,
          { variant: "warning" }
        );
      }
    }
    setAccountAddress(normalizeHexString(starknetWindow.account.address));
  };

  const execute = async (calls: Call[], options?: { value?: BigNumberish }) => {
    const starknetWindow = await getStarknet({ modalMode: "neverAsk" });
    if (starknetWindow === null) {
      throw new Error("Account is not connected");
    }
    if (starknetWindow.isConnected === false) {
      throw new Error("Account is not connected");
    }
    if (options?.value) {
      calls = [
        {
          contractAddress:
            "0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7",
          entrypoint: "approve",
          calldata: stark.compileCalldata({
            spender: calls[0].contractAddress,
            amount: {
              type: "struct",
              low: number.toBN(options.value.toString()),
              high: 0,
            },
          }),
        },
        ...calls,
      ];
    }

    return await starknetWindow.account.execute(calls);
  };

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
