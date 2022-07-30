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
import LoadingDots from "./components/LoadingDots/LoadingDots";
import BN from "bn.js";
import { HotKeys } from "react-hotkeys";
import {
  getBottomCellName,
  getLeftCellName,
  getRightCellName,
  getTopCellName,
} from "./utils/sheetUtils";
import { SnackbarProvider } from "notistack";

const MAX_ROWS = 15;
const MAX_COLUMNS = 15;

const keyMap = {
  RIGHT: "ArrowRight",
  LEFT: "ArrowLeft",
  TOP: "ArrowUp",
  BOTTOM: "ArrowDown",
};

function App() {
  const connectors = getInstalledInjectedConnectors();
  const [selectedCell, setSelectedCell] = React.useState<{
    name: string;
    id: number;
  } | null>(null);

  const { loading, values, hasLoaded, cellNames } =
    useContext(CellValuesContext);

  const selectedCellOwner = useMemo(
    () =>
      hasLoaded &&
      selectedCell &&
      values[selectedCell.id].owner &&
      values[selectedCell.id].owner.toString() !== "0"
        ? toHex(values[selectedCell.id].owner as BN)
        : undefined,
    [values, hasLoaded, selectedCell]
  );

  const handlers = useMemo(
    () => ({
      RIGHT: () => {
        if (selectedCell) {
          const newName = getRightCellName(selectedCell.name, MAX_COLUMNS);
          setSelectedCell({
            name: newName,
            id: cellNames.indexOf(newName),
          });
        }
      },
      LEFT: () => {
        if (selectedCell) {
          const newName = getLeftCellName(selectedCell.name);
          setSelectedCell({
            name: newName,
            id: cellNames.indexOf(newName),
          });
        }
      },
      TOP: () => {
        if (selectedCell) {
          const newName = getTopCellName(selectedCell.name);
          setSelectedCell({
            name: newName,
            id: cellNames.indexOf(newName),
          });
        }
      },
      BOTTOM: () => {
        if (selectedCell) {
          const newName = getBottomCellName(selectedCell.name, MAX_ROWS);
          setSelectedCell({
            name: newName,
            id: cellNames.indexOf(newName),
          });
        }
      },
    }),
    [cellNames, selectedCell]
  );

  return (
    <SnackbarProvider maxSnack={3}>
      <StarknetProvider connectors={connectors}>
        <HotKeys keyMap={keyMap} handlers={handlers} allowChanges>
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
            {loading && (
              <Box
                sx={{
                  display: "flex",
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Press Start 2P', cursive",
                }}
              >
                Loading
                <LoadingDots />
              </Box>
            )}
            {!loading && values.length !== 0 && (
              <SheetTable
                selectedCell={selectedCell}
                setSelectedCell={setSelectedCell}
                cellsData={values}
                columns={MAX_COLUMNS}
                rows={MAX_ROWS}
                sx={{
                  zIndex: 0,
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
        </HotKeys>{" "}
      </StarknetProvider>
    </SnackbarProvider>
  );
}

export default App;
