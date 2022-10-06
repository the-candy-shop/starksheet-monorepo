import { BoxProps } from "@mui/material";
import { disconnect, getStarknet } from "get-starknet";
import { useSnackbar } from "notistack";
import { useContext } from "react";
import { AccountContext } from "../../contexts/AccountContext";
import { hex2str } from "../../utils/hexUtils";
import Button from "../Button/Button";

export type ConnectButtonProps = {
  sx?: BoxProps["sx"];
};

function ConnectButton({ sx }: ConnectButtonProps) {
  const { accountAddress, setAccountAddress } = useContext(AccountContext);
  const { enqueueSnackbar } = useSnackbar();

  const onClick = async () => {
    if (getStarknet().isConnected) {
      disconnect();
    }
    const selected = await getStarknet().enable({ showModal: true });
    const chainId = hex2str(getStarknet().account.chainId);
    if (
      !process.env.REACT_APP_NETWORK?.includes(chainId.slice(3).toLowerCase())
    ) {
      enqueueSnackbar(
        `Wrong network detected: "${chainId
          .slice(3)
          .toLowerCase()}" instead of "${
          process.env.REACT_APP_NETWORK?.split("-")[1]
        }"`,
        { variant: "warning" }
      );
    }
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
