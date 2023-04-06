import { BoxProps } from "@mui/material";
import { useContext } from "react";
import { AccountContext } from "../../contexts/AccountContext";
import Button from "../Button/Button";

export type ConnectButtonProps = {
  sx?: BoxProps["sx"];
};

function ConnectButton({ sx }: ConnectButtonProps) {
  const { accountAddress, connect } = useContext(AccountContext);

  return (
    <Button
      onClick={connect}
      sx={{
        color: "#0000FF",
        ...sx,
      }}
    >
      {accountAddress ? accountAddress.substring(0, 8) : "Connect"}
    </Button>
  );
}

export default ConnectButton;
