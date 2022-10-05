import { BoxProps } from "@mui/material";
import { disconnect, getStarknet } from "get-starknet";
import { useContext } from "react";
import { AccountContext } from "../../contexts/AccountContext";
import Button from "../Button/Button";

export type ConnectButtonProps = {
  sx?: BoxProps["sx"];
};

function ConnectButton({ sx }: ConnectButtonProps) {
  const { accountAddress, setAccountAddress } = useContext(AccountContext);

  const onClick = async () => {
    if (getStarknet().isConnected) {
      disconnect();
    }
    const selected = await getStarknet().enable({ showModal: true });
    setAccountAddress(selected[0]);
  };

  return (
    <Button
      onClick={onClick}
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
