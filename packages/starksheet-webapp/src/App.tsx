import React, { useContext, useMemo } from "react";
import Header from "./components/Header/Header";
import { Box } from "@mui/material";
import SheetTable from "./components/SheetTable/SheetTable";
import { CELL_BORDER_WIDTH, CELL_HEIGHT } from "./config";
import Footer from "./components/Footer/Footer";
import ActionBar from "./components/ActionBar/ActionBar";
import { CellValuesContext } from "./contexts/CellValuesContext";
import { toHex } from "starknet/utils/number";
import {
  getInstalledInjectedConnectors,
  StarknetProvider,
} from "@starknet-react/core";

function App() {
  const connectors = getInstalledInjectedConnectors();
  const [selectedCell, setSelectedCell] = React.useState<{
    name: string;
    id: number;
  } | null>(null);

  const { loading, values, hasLoaded } = useContext(CellValuesContext);

  const selectedCellOwner = useMemo(
    () =>
      hasLoaded &&
      selectedCell &&
      values[selectedCell.id].owner &&
      values[selectedCell.id].owner.toString() !== "0"
        ? toHex(values[selectedCell.id].owner)
        : undefined,
    [values, hasLoaded, selectedCell]
  );

  return (
    <StarknetProvider connectors={connectors}>
      <Box
        className="App"
        sx={{ display: "flex", flexDirection: "column", height: "100vh" }}
      >
        <Header />
        <ActionBar
          selectedCell={selectedCell}
          owner={selectedCellOwner}
          sx={{ marginTop: `-${CELL_BORDER_WIDTH}px`, zIndex: 1 }}
        />
        {(loading && !hasLoaded) ||
          (values.length === 0 && <Box>Loading...</Box>)}
        {!loading && hasLoaded && (
          <SheetTable
            selectedCell={selectedCell}
            setSelectedCell={setSelectedCell}
            cellsData={values}
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
        )}
        <Footer sx={{ zIndex: 1 }} />
      </Box>
    </StarknetProvider>
  );
}

export default App;
