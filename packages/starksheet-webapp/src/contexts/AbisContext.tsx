import React, { PropsWithChildren, useState } from "react";
import { Abi } from "starknet";
import { toBN } from "starknet/utils/number";
import { RC_BOUND } from "../components/ActionBar/formula.utils";
import { starknetSequencerProvider } from "../provider";
import { ContractAbi, ContractAbis, InitialContractAbis } from "../types";
import { parseAbi } from "../utils/abiUtils";

export const AbisContext = React.createContext<{
  contractAbis: ContractAbis;
  setAbiForContract: (address: string, abi: Abi) => void;
  getAbiForContract: (address: string) => Promise<ContractAbi>;
}>({
  contractAbis: {},
  setAbiForContract: () => {},
  getAbiForContract: async () => ({}),
});

export const AbisContextProvider = ({
  initialContractAbis,
  children,
}: PropsWithChildren<{ initialContractAbis: InitialContractAbis }>) => {
  const _initialContractAbis = Object.entries(initialContractAbis).reduce(
    (prev, cur) => ({
      ...prev,
      [cur[0]]: parseAbi(cur[1] as Abi),
    }),
    {}
  );
  const [contractAbis, setContractAbis] =
    useState<ContractAbis>(_initialContractAbis);

  const setAbiForContract = (address: string, abi: Abi) => {
    setContractAbis((prevContractAbis) => ({
      ...prevContractAbis,
      ["0x" + toBN(address).toString(16)]: parseAbi(abi),
    }));
  };

  const getAbiForContract = async (address: string) => {
    const _address = "0x" + toBN(address).toString(16);
    if (_address in contractAbis) {
      return contractAbis[_address];
    }

    let abi: Abi = [];
    if (!toBN(_address).eq(RC_BOUND)) {
      try {
        const response = await starknetSequencerProvider.getClassAt(_address);
        abi = response.abi || abi;
      } catch (error) {
        console.log(error);
      }
    }
    abi = [
      ...abi,
      ...(
        await Promise.all(
          abi
            .filter(
              (f) =>
                f.name.includes("impl") &&
                f.type === "function" &&
                f.stateMutability === "view" &&
                f.inputs.length === 0
            )
            .map(async (f) => {
              const implementationAddress =
                await starknetSequencerProvider.callContract({
                  contractAddress: address,
                  entrypoint: f.name,
                });
              return Object.values(
                (await getAbiForContract(implementationAddress.result[0])) || {}
              );
            })
        )
      ).flat(),
    ];
    setAbiForContract(_address, abi);
    return parseAbi(abi);
  };

  return (
    <AbisContext.Provider
      value={{
        contractAbis,
        // @ts-ignore
        getAbiForContract,
        setAbiForContract,
      }}
    >
      {children}
    </AbisContext.Provider>
  );
};
