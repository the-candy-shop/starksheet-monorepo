import React from "react";
import Header from "./components/Header/Header";
import { Box } from "@mui/material";
import SheetTable from "./components/SheetTable/SheetTable";
import { CELL_BORDER_WIDTH, CELL_HEIGHT } from "./config";
import Footer from "./components/Footer/Footer";
import ActionBar from "./components/ActionBar/ActionBar";
import { CellValuesContextProvider } from "./contexts/CellValuesContext";
import {
  getInstalledInjectedConnectors,
  StarknetProvider,
} from "@starknet-react/core";

function App() {
  const [selectedCell, setSelectedCell] = React.useState<string | null>(null);
  const connectors = getInstalledInjectedConnectors();

  return (
    <StarknetProvider connectors={connectors}>
      <CellValuesContextProvider>
        <Box
          className="App"
          sx={{ display: "flex", flexDirection: "column", height: "100vh" }}
        >
          <Header />
          <ActionBar
            selectedCell={selectedCell}
            sx={{ marginTop: `-${CELL_BORDER_WIDTH}px`, zIndex: 1 }}
          />
          <SheetTable
            selectedCell={selectedCell}
            setSelectedCell={setSelectedCell}
            sx={{
              marginTop: `-${CELL_BORDER_WIDTH}px`,
              marginBottom: `-${CELL_BORDER_WIDTH}px`,
              overflow: "auto",
              flex: 1,
              "&::-webkit-scrollbar": {
                width: `${CELL_HEIGHT}px`,
                height: `${CELL_HEIGHT}px`,
                backgroundColor: "#C6D2E4",
                border: `${CELL_BORDER_WIDTH}px solid black`,
                boxShadow: `inset -5px -5px 3px #DCE3ED, inset 5px 5px 3px #949EAC`,
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#C6D2E4",
                border: `${CELL_BORDER_WIDTH}px solid black`,
                boxShadow: `inset 5px 5px 3px #DCE3ED, inset -5px -5px 3px #949EAC`,
                cursor: "pointer",
              },
              "&::-webkit-scrollbar-corner": {
                backgroundColor: "#C6D2E4",
                border: `${CELL_BORDER_WIDTH}px solid black`,
                boxShadow: `inset 5px 5px 3px #DCE3ED, inset -5px -5px 3px #949EAC`,
              },
            }}
          />
          <Footer sx={{ zIndex: 1 }} />
        </Box>
      </CellValuesContextProvider>
    </StarknetProvider>
  );
}

export default App;
