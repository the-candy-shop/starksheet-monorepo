import React, { PropsWithChildren, useState } from "react";
import { AppStatus } from "../types";

const defaultStatus = {
  loading: true,
  error: false,
  message: "Loading",
};

export const AppStatusContext = React.createContext<{
  appStatus: AppStatus;
  setAppStatus: (status: AppStatus) => void;
  updateAppStatus: (status: Partial<AppStatus>) => void;
}>({
  appStatus: defaultStatus,
  setAppStatus: () => {},
  updateAppStatus: () => {},
});

export const AppStatusContextProvider = ({
  children,
}: PropsWithChildren<{}>) => {
  const [appStatus, setAppStatus] = useState<AppStatus>(defaultStatus);

  const updateAppStatus = (status: Partial<AppStatus>) => {
    setAppStatus({ ...appStatus, ...status });
  };

  return (
    <AppStatusContext.Provider
      value={{
        appStatus,
        setAppStatus,
        updateAppStatus,
      }}
    >
      {children}
    </AppStatusContext.Provider>
  );
};
