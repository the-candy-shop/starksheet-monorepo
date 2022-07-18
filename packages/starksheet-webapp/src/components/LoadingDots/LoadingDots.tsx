import React from "react";
import { Box } from "@mui/material";

function LoadingDots() {
  return (
    <Box
      component="span"
      sx={{
        "@keyframes sk-bouncedelay": {
          "0%, 80%, 100%": {
            opacity: "0",
          },
          "39%": {
            opacity: "0",
          },
          "40%": {
            opacity: "1",
          },
          "79%": {
            opacity: "1",
          },
        },
      }}
    >
      <Box
        component="span"
        sx={{
          animation: "sk-bouncedelay 1.4s infinite ease-in-out both",
          animationDelay: "-0.32s",
        }}
      >
        .
      </Box>
      <Box
        component="span"
        sx={{
          animation: "sk-bouncedelay 1.4s infinite ease-in-out both",
          animationDelay: "-0.16s",
        }}
      >
        .
      </Box>
      <Box
        component="span"
        sx={{
          animation: "sk-bouncedelay 1.4s infinite ease-in-out both",
        }}
      >
        .
      </Box>
    </Box>
  );
}

export default LoadingDots;
