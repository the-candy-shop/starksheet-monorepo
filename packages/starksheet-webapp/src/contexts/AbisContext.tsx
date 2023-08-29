import React, { PropsWithChildren, useState } from "react";
import { Abi } from "starknet";
import { useChainProvider } from "../hooks/useChainProvider";
import { ContractAbi, ContractAbis, InitialContractAbis } from "../types";
import { RC_BOUND } from "../utils/constants";
import { bigint2hex, normalizeHexString } from "../utils/hexUtils";

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
  const chainProvider = useChainProvider();

  const _initialContractAbis = Object.entries(initialContractAbis).reduce(
    (prev, cur) => ({
      ...prev,
      [normalizeHexString(cur[0])]: chainProvider.parseAbi(cur[1] as Abi),
    }),
    {
      [bigint2hex(RC_BOUND)]: {},
    }
  );

  const [contractAbis, setContractAbis] =
    useState<ContractAbis>(_initialContractAbis);
  const setAbiForContract = (address: string, abi: Abi) => {
    setContractAbis((prevContractAbis) => ({
      ...prevContractAbis,
      [normalizeHexString(address)]: chainProvider.parseAbi(abi),
    }));
  };

  const getAbiForContract = async (address: string) => {
    const _address = normalizeHexString(address);
    if (_address in contractAbis) return contractAbis[_address];

    const abi = await chainProvider.getAbi(_address);
    setAbiForContract(_address, abi);
    return chainProvider.parseAbi(abi);
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
