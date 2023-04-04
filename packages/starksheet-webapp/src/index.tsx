import { SnackbarProvider } from "notistack";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AbisContextProvider } from "./contexts/AbisContext";
import { AccountContextProvider } from "./contexts/AccountContext";
import { AppStatusContextProvider } from "./contexts/AppStatusContext";
import { CellValuesContextProvider } from "./contexts/CellValuesContext";
import { OnsheetContextProvider } from "./contexts/OnsheetContext";
import { TransactionsContextProvider } from "./contexts/TransactionsContext";

import onsheetContractData from "./contract.json";
import "./index.css";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

function Root() {
  return (
    <SnackbarProvider maxSnack={3}>
      <AppStatusContextProvider>
        <AccountContextProvider>
          <AbisContextProvider
            initialContractAbis={onsheetContractData.contractAbis}
          >
            <OnsheetContextProvider
              onsheetAddress={onsheetContractData.address}
            >
              <CellValuesContextProvider>
                <TransactionsContextProvider>
                  <App />
                </TransactionsContextProvider>
              </CellValuesContextProvider>
            </OnsheetContextProvider>
          </AbisContextProvider>
        </AccountContextProvider>
      </AppStatusContextProvider>
    </SnackbarProvider>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
