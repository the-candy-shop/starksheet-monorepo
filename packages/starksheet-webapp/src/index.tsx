import { SnackbarProvider } from "notistack";
import ReactDOM from "react-dom/client";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import App from "./App";
import SheetTable from "./components/SheetTable/SheetTable";
import { AbisContextProvider } from "./contexts/AbisContext";
import { AccountContextProvider } from "./contexts/AccountContext";
import { AppStatusContextProvider } from "./contexts/AppStatusContext";
import { CellValuesContextProvider } from "./contexts/CellValuesContext";
import { ChainProviderContextProvider } from "./contexts/ChainProviderContext";
import { OnsheetContextProvider } from "./contexts/OnsheetContext";
import { TransactionsContextProvider } from "./contexts/TransactionsContext";
import "./index.css";
import reportWebVitals from "./reportWebVitals";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <Navigate to="/" />,
    children: [
      {
        path: "/:address",
        element: <SheetTable />,
        loader: (args) => args,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<RouterProvider router={router} />);

function Root() {
  return (
    <ChainProviderContextProvider>
      <SnackbarProvider maxSnack={3}>
        <AppStatusContextProvider>
          <AccountContextProvider>
            <AbisContextProvider initialContractAbis={{}}>
              <OnsheetContextProvider>
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
    </ChainProviderContextProvider>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
