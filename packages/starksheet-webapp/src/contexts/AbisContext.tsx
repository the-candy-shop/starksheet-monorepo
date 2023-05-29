import React, { PropsWithChildren, useState } from "react";
import { Abi } from "starknet";
import { ContractAbi, ContractAbis, InitialContractAbis } from "../types";
import { parseAbi } from "../utils/abiUtils";
import { normalizeHexString } from "../utils/hexUtils";
import { useChainProvider } from "../hooks/useChainProvider";

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

  const chainProvider = useChainProvider();

  const setAbiForContract = (address: string, abi: Abi) => {
    setContractAbis((prevContractAbis) => ({
      ...prevContractAbis,
      [normalizeHexString(address)]: parseAbi(abi),
    }));
  };

  const getAbiForContract = async (address: string) => {
    const _address = normalizeHexString(address);

    if (_address in contractAbis) return contractAbis[_address];

    const abi = await chainProvider.getAbi(address);
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
