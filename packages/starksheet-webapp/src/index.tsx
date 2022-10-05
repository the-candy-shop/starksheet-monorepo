import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AbisContextProvider } from "./contexts/AbisContext";
import { AccountContextProvider } from "./contexts/AccountContext";
import { CellValuesContextProvider } from "./contexts/CellValuesContext";
import { StarksheetContextProvider } from "./contexts/StarksheetContext";
import starksheetContractData from "./contract.json";
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
    <AccountContextProvider>
      <AbisContextProvider
        initialContractAbis={starksheetContractData.contractAbis}
      >
        <StarksheetContextProvider
          starksheetAddress={starksheetContractData.address}
        >
          <CellValuesContextProvider>
            <App />
          </CellValuesContextProvider>
        </StarksheetContextProvider>
      </AbisContextProvider>
    </AccountContextProvider>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
