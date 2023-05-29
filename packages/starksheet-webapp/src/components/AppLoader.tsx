import React from 'react';
import {useChainProvider} from '../hooks/useChainProvider';

const AppLoader = ({ children }: React.PropsWithChildren) => {
  const chainProvider = useChainProvider();

  if (!chainProvider) {
    return <p>I'm an ugly loader</p>; // or return a loading spinner, or a placeholder, etc.
  }

  return <>{children}</>;
};

export default AppLoader;
