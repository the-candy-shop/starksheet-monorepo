import { Box } from "@mui/material";
import React, { useContext, useMemo } from "react";
import ContentEditable from "react-contenteditable";
import { HotKeys } from "react-hotkeys";
import ActionBar from "./components/ActionBar/ActionBar";
import Footer from "./components/Footer/Footer";
import Header from "./components/Header/Header";
import LoadingDots from "./components/LoadingDots/LoadingDots";
import SheetTable from "./components/SheetTable/SheetTable";
import { CELL_BORDER_WIDTH, CELL_HEIGHT } from "./config";
import { AppStatusContext } from "./contexts/AppStatusContext";
import { CellValuesContext } from "./contexts/CellValuesContext";
import { StarksheetContext } from "./contexts/StarksheetContext";
import {
  getBottomCellName,
  getLeftCellName,
  getRightCellName,
  getTopCellName,
} from "./utils/sheetUtils";

const MAX_ROWS = 15;
const MAX_COLUMNS = 15;

const keyMap = {
  RIGHT: "ArrowRight",
  LEFT: "ArrowLeft",
  TOP: "ArrowUp",
  BOTTOM: "ArrowDown",
  ESC: "Escape",
  TAB: "Tab",
};

function App() {
  const [selectedCell, setSelectedCell] = React.useState<{
    name: string;
    id: number;
  } | null>(null);

  const { appStatus } = useContext(AppStatusContext);
  const { cellNames, currentCells } = useContext(CellValuesContext);
  const { selectedSheetAddress } = useContext(StarksheetContext);

  const inputRef = React.useRef<ContentEditable>(null);

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
      ESC: () => {
        if (selectedCell) {
          setSelectedCell(null);
          inputRef?.current?.el.current.blur();
        }
      },
      TAB: () => {
        if (selectedCell) {
          const newName = getRightCellName(selectedCell.name, MAX_COLUMNS);
          setSelectedCell({
            name: newName,
            id: cellNames.indexOf(newName),
          });
        }
      },
    }),
    [cellNames, selectedCell]
  );

  const message = useMemo(
    () =>
      selectedSheetAddress
        ? appStatus.sheets[selectedSheetAddress].message
        : appStatus.message,
    [appStatus, selectedSheetAddress]
  );

  const loading = useMemo(
    () =>
      selectedSheetAddress
        ? appStatus.sheets[selectedSheetAddress].loading
        : appStatus.loading,
    [appStatus, selectedSheetAddress]
  );

  const error = useMemo(
    () =>
      selectedSheetAddress
        ? appStatus.sheets[selectedSheetAddress].error
        : appStatus.error,
    [appStatus, selectedSheetAddress]
  );

  const hideSheet = useMemo(
    () => loading || error || message || currentCells.length === 0,
    [loading, error, message, currentCells]
  );

  return (
    <HotKeys keyMap={keyMap} handlers={handlers} allowChanges>
      <Box
        className="App"
        sx={{ display: "flex", flexDirection: "column", height: "100vh" }}
      >
        <Header />
        <ActionBar
          inputRef={inputRef}
          selectedCell={selectedCell}
          sx={{ marginTop: `-${CELL_BORDER_WIDTH}px`, zIndex: 1 }}
        />
        {hideSheet ? (
          <Box
            sx={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Press Start 2P', cursive",
            }}
          >
            {message}
            {loading && <LoadingDots />}
          </Box>
        ) : (
          <SheetTable
            selectedCell={selectedCell}
            setSelectedCell={setSelectedCell}
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
    </HotKeys>
  );
}

export default App;
