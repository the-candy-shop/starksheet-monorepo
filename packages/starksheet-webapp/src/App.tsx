import { Box } from "@mui/material";
import React, { useContext, useMemo } from "react";
import ContentEditable from "react-contenteditable";
import { HotKeys } from "react-hotkeys";
import { Outlet, useLocation } from "react-router-dom";
import ActionBar from "./components/ActionBar/ActionBar";
import Footer from "./components/Footer/Footer";
import Header from "./components/Header/Header";
import LoadingDots from "./components/LoadingDots/LoadingDots";
import { CELL_BORDER_WIDTH, N_COL, N_ROW } from "./config";
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
  const { selectedCell, setSelectedCell } = useContext(CellValuesContext);
  const { selectedSheetAddress } = useContext(OnsheetContext);

  const inputRef = React.useRef<ContentEditable>(null);
  const location = useLocation();

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
    () => loading || error || location.pathname === "/",
    [loading, error, location]
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
          <Outlet />
        )}
        <Footer sx={{ zIndex: 1 }} />
      </Box>
    </HotKeys>
  );
}

export default App;
