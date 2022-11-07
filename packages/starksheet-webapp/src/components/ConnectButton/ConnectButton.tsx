import { BoxProps } from "@mui/material";
import { disconnect, getStarknet } from "get-starknet";
import { useSnackbar } from "notistack";
import { useContext } from "react";
import { AccountContext } from "../../contexts/AccountContext";
import { chainId } from "../../provider";
import { hex2str, normalizeHexString } from "../../utils/hexUtils";
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
    if (chainId !== hex2str(getStarknet().account.chainId)) {
      getStarknet().request({
        type: "wallet_switchStarknetChain",
        params: { chainId },
      });
      enqueueSnackbar(
        `Wrong network detected: "${hex2str(chainId)}" instead of "${chainId}"`,
        { variant: "warning" }
      );
    }
    setAccountAddress(normalizeHexString(selected[0]));
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
