import React from "react";
import Header from "./components/Header/Header";
import { Box } from "@mui/material";
import { StarknetContextProvider } from "./contexts/StarknetContext";

function App() {
  return (
    <StarknetContextProvider>
      <Box className="App">
        <Header />
      </Box>
    </StarknetContextProvider>
  );
}

export default App;
