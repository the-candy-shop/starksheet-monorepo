import React, { PropsWithChildren, useState } from "react";
import { AppStatus, Status } from "../types";

const defaultStatus = {
  loading: true,
  error: false,
  message: "Loading",
  sheets: {},
};

export const defaultSheetStatus = { loading: false, message: "", error: false };

export const AppStatusContext = React.createContext<{
  appStatus: AppStatus;
  setAppStatus: (status: AppStatus) => void;
  updateAppStatus: (status: Partial<AppStatus>) => void;
  updateSheetStatus: (address: string, status: Partial<Status>) => void;
}>({
  appStatus: defaultStatus,
  setAppStatus: () => {},
  updateAppStatus: () => {},
  updateSheetStatus: () => {},
});

export const AppStatusContextProvider = ({
  children,
}: PropsWithChildren<{}>) => {
  const [appStatus, setAppStatus] = useState<AppStatus>(defaultStatus);

  const updateAppStatus = (status: Partial<AppStatus>) => {
    setAppStatus({ ...appStatus, ...status });
  };

  const updateSheetStatus = (address: string, status: Partial<Status>) => {
    setAppStatus((prevStatus) => ({
      ...prevStatus,
      sheets: {
        ...prevStatus.sheets,
        [address]: { ...prevStatus.sheets[address], ...status },
      },
    }));
  };

  return (
    <AppStatusContext.Provider
      value={{
        appStatus,
        setAppStatus,
        updateAppStatus,
        updateSheetStatus,
      }}
    >
      {children}
    </AppStatusContext.Provider>
  );
};
