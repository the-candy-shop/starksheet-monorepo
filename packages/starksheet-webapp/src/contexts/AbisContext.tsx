import React, { PropsWithChildren, useState } from "react";
import { Abi } from "starknet";
import { toBN } from "starknet/utils/number";
import { RC_BOUND } from "../components/ActionBar/formula.utils";
import { starknetSequencerProvider } from "../provider";
import {
  ContractAbi,
  ContractAbis,
  InitialContractAbis,
  parseAbi,
} from "../utils/abiUtils";

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
    setContractAbis({
      ...contractAbis,
      ["0x" + toBN(address).toString(16)]: parseAbi(abi),
    });
  };

  const getAbiForContract = async (address: string) => {
    const _address = "0x" + toBN(address).toString(16);
    if (!(_address in contractAbis)) {
      let abi: Abi = [];
      if (!toBN(_address).eq(RC_BOUND)) {
        try {
          const response = await starknetSequencerProvider.getClassAt(_address);
          abi = response.abi || abi;
        } catch (error) {
          console.log(error);
        }
      }
      setAbiForContract(_address, abi);
      return parseAbi(abi);
    }
    return contractAbis[_address];
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
