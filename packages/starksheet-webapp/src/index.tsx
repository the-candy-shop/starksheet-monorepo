import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { CellValuesContextProvider } from "./contexts/CellValuesContext";
import {
  getInstalledInjectedConnectors,
  StarknetProvider,
} from "@starknet-react/core";

const connectors = getInstalledInjectedConnectors();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <StarknetProvider connectors={connectors}>
      <CellValuesContextProvider>
        <App />
      </CellValuesContextProvider>
    </StarknetProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
