import React, { PropsWithChildren, useState } from "react";
import { Abi } from "starknet";
import { starknetProvider } from "../provider";
import {
  ContractAbi,
  ContractAbis,
  InitialContractAbis,
  parseAbi,
} from "../utils/abiUtils";

export const AbisContext = React.createContext<{
  contractAbis: ContractAbis;
  setAbiForContract: (address: string, abi: Abi) => void;
  getAbiForContract: (address: string) => Promise<ContractAbi | void>;
}>({
  contractAbis: {},
  setAbiForContract: () => {},
  getAbiForContract: async () => {},
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
    setContractAbis({ ...contractAbis, [address]: parseAbi(abi) });
  };

  const getAbiForContract = async (address: string) => {
    if (!(address in contractAbis)) {
      const response = await starknetProvider.getCode(address);
      setAbiForContract(address, response.abi);
      return parseAbi(response.abi);
    } else {
      return contractAbis[address];
    }
  };

  return (
    <AbisContext.Provider
      value={{
        contractAbis,
        getAbiForContract,
        setAbiForContract,
      }}
    >
      {children}
    </AbisContext.Provider>
  );
};
