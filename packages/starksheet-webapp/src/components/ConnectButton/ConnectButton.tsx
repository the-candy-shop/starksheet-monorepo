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
    const chainId = getStarknet().account.chainId;
    const appNetwork = process.env.REACT_APP_NETWORK || "";
    console.log("chainId", hex2str(chainId));
    console.log("appNetwork", appNetwork);
    if (appNetwork !== hex2str(chainId)) {
      getStarknet().request({
        type: "wallet_switchStarknetChain",
        params: { chainId: appNetwork },
      });
      enqueueSnackbar(
        `Wrong network detected: "${hex2str(
          chainId
        )}" instead of "${appNetwork}"`,
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
