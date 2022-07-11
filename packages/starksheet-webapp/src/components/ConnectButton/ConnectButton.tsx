import React, { useCallback, useState } from "react";
import Button from "../Button/Button";
import { Box, BoxProps, Dialog } from "@mui/material";
import GreyCell from "../GreyCell/GreyCell";
import { useStarknet } from "@starknet-react/core";
import { CELL_BORDER_WIDTH } from "../../config";

export type ConnectButtonProps = {
  sx?: BoxProps["sx"];
};

function ConnectButton({ sx }: ConnectButtonProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const { connect, account, connectors } = useStarknet();

  const displayedButton = account ? (
    <GreyCell sx={{ ...sx, "& .content": { justifyContent: "center" } }}>
      {account.substring(0, 8)}
    </GreyCell>
  ) : (
    <Button
      onClick={open}
      sx={{
        color: "#0000FF",
        textTransform: "uppercase",
        ...sx,
      }}
    >
      Connect
    </Button>
  );

  return (
    <>
      {displayedButton}
      <Dialog
        open={isOpen && !account}
        onClose={close}
        sx={{
          "& .MuiPaper-root": {
            borderRadius: 0,
            boxShadow: "none",
            border: `${CELL_BORDER_WIDTH}px solid black`,
          },
        }}
      >
        <Box>
          {connectors.map((connector) =>
            connector.available() ? (
              <Button
                sx={{ margin: "16px" }}
                key={connector.id()}
                onClick={() => connect(connector)}
              >
                Connect {connector.name()}
              </Button>
            ) : null
          )}
        </Box>
      </Dialog>
    </>
  );
}

export default ConnectButton;
