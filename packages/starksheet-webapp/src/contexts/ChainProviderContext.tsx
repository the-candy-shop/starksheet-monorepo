import React, { useEffect, useState } from "react";
import { chainConfig, chainImplementation } from "../provider/chains";
import { ChainProvider } from "../types";

/**
 * The ChainProviderContext.
 *
 * This context exposes an instantiated ChainProvider.
 */
export const ChainProviderContext = React.createContext<ChainProvider>(
  {} as ChainProvider,
);

/**
 * The ChainProviderContextProvider.
 *
 * This component instantiates a ChainProvider based on the RPC provided as an environment variable.
 * It waits for the provided to be fully instantiated before loading the rest of the component tree (i.e. the component
 * children).
 */
export const ChainProviderContextProvider = ({
  children,
}: React.PropsWithChildren) => {
  const [chainProvider, setProvider] = useState<ChainProvider>();

  // this effect creates a chain provider for the environment rpc provider
  useEffect(() => {
    // create a chain provider instance matching the given config for the given chain type
    const instance = chainImplementation.build(chainConfig.rpcUrl, chainConfig);
    // set the built instance as the hook chain provider
    setProvider(instance);
  }, [setProvider]);

  if (!chainProvider) {
    return <p>loading...</p>;
  }

  return (
    <ChainProviderContext.Provider value={chainProvider}>
      {children}
    </ChainProviderContext.Provider>
  );
};
