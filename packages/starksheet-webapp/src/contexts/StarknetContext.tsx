import React, { PropsWithChildren } from "react";
import { IStarknetWindowObject } from "@argent/get-starknet";

export const StarknetContext = React.createContext<{
  starknet?: IStarknetWindowObject;
  setStarknet: (value: IStarknetWindowObject | undefined) => void;
}>({
  setStarknet: () => {},
});

export const StarknetContextProvider = ({
  children,
}: PropsWithChildren<{}>) => {
  const [starknet, setStarknet] = React.useState<
    IStarknetWindowObject | undefined
  >(undefined);

  return (
    <StarknetContext.Provider value={{ starknet, setStarknet }}>
      {children}
    </StarknetContext.Provider>
  );
};
