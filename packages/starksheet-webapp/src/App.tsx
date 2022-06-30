import React from "react";
import Header from "./components/Header/Header";
import { Box } from "@mui/material";
import { StarknetContextProvider } from "./contexts/StarknetContext";
import SheetTable from "./components/SheetTable/SheetTable";
import { CELL_BORDER_WIDTH } from "./config";
import Footer from "./components/Footer/Footer";

function App() {
  return (
    <StarknetContextProvider>
      <Box
        className="App"
        sx={{ display: "flex", flexDirection: "column", height: "100vh" }}
      >
        <Header />
        <Box sx={{ flex: 1, overflow: "auto" }}>
          <SheetTable sx={{ marginTop: `-${CELL_BORDER_WIDTH}px` }} />
        </Box>
        <Footer />
      </Box>
    </StarknetContextProvider>
  );
}

export default App;
