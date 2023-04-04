import { Box } from "@mui/material";
import React, { useContext, useMemo } from "react";
import ContentEditable from "react-contenteditable";
import { HotKeys } from "react-hotkeys";
import ActionBar from "./components/ActionBar/ActionBar";
import Footer from "./components/Footer/Footer";
import Header from "./components/Header/Header";
import LoadingDots from "./components/LoadingDots/LoadingDots";
import SheetTable from "./components/SheetTable/SheetTable";
import { CELL_BORDER_WIDTH, CELL_HEIGHT, N_COL, N_ROW } from "./config";
import { AppStatusContext } from "./contexts/AppStatusContext";
import { CellValuesContext } from "./contexts/CellValuesContext";
import { OnsheetContext } from "./contexts/OnsheetContext";

const keyMap = {
  RIGHT: "ArrowRight",
  LEFT: "ArrowLeft",
  TOP: "ArrowUp",
  BOTTOM: "ArrowDown",
  ESC: "Escape",
  TAB: "Tab",
};

function App() {
  const { appStatus } = useContext(AppStatusContext);
  const { currentCells, selectedCell, setSelectedCell } =
    useContext(CellValuesContext);
  const { selectedSheetAddress } = useContext(OnsheetContext);

  const inputRef = React.useRef<ContentEditable>(null);

  const handlers = useMemo(
    () => ({
      RIGHT: () => {
        setSelectedCell(
          selectedCell + 1 < N_ROW * N_COL ? selectedCell + 1 : selectedCell
        );
      },
      LEFT: () => {
        setSelectedCell(
          selectedCell - 1 >= 0 ? selectedCell - 1 : selectedCell
        );
      },
      TOP: () => {
        setSelectedCell(
          selectedCell - N_COL >= 0 ? selectedCell - N_COL : selectedCell
        );
      },
      BOTTOM: () => {
        setSelectedCell(
          selectedCell + N_COL < N_COL * N_ROW
            ? selectedCell + N_COL
            : selectedCell
        );
      },
      ESC: () => {
        inputRef?.current?.el.current.blur();
      },
      TAB: () => {
        setSelectedCell(
          selectedCell + 1 < N_ROW * N_COL ? selectedCell + 1 : selectedCell
        );
      },
    }),
    [selectedCell, setSelectedCell]
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
            <p dangerouslySetInnerHTML={{ __html: message }} />
            {loading && <LoadingDots />}
          </Box>
        ) : (
          <SheetTable
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
