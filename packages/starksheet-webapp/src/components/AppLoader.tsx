import React from "react";
import { useChainProvider } from "../hooks/useChainProvider";

/**
 * Provides a loader for the app.
 *
 * This component displays a loading text until the chain provider has been initialized.
 */
const AppLoader = ({ children }: React.PropsWithChildren) => {
  const chainProvider = useChainProvider();

  if (!chainProvider) {
    return <p>loading</p>;
  }

  return <>{children}</>;
};

export default AppLoader;
