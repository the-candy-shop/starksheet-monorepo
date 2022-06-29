import React from "react";
import Button from "../Button/Button";
import { BoxProps } from "@mui/material";
import { useStarknet } from "../../hooks/useStarknet";
import GreyCell from "../GreyCell/GreyCell";

export type ConnectButtonProps = {
  sx?: BoxProps["sx"];
};

function ConnectButton({ sx }: ConnectButtonProps) {
  const { connect, starknet } = useStarknet();
  const account = starknet?.account;

  return account ? (
    <GreyCell sx={{ ...sx, justifyContent: "center" }}>
      {account.address.substring(0, 8)}
    </GreyCell>
  ) : (
    <Button
      onClick={connect}
      sx={{
        color: "#0000FF",
        textTransform: "uppercase",
        ...sx,
      }}
    >
      Connect
    </Button>
  );
}

export default ConnectButton;
