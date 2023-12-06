import { BoxProps } from "@mui/material";
import { useContext, useMemo } from "react";
import { AccountContext } from "../../contexts/AccountContext";
import Button from "../Button/Button";

export type ConnectButtonProps = {
  sx?: BoxProps["sx"];
};

function ConnectButton({ sx }: ConnectButtonProps) {
  const { accountDomain, connect } = useContext(AccountContext);

  const displayedName = useMemo(() => {
    if (!accountDomain) {
      return "Connect";
    }
    if (accountDomain.length <= 8) {
      return accountDomain;
    }
    return `${accountDomain.substring(0, 8)}...`;
  }, [accountDomain]);

  return (
    <Button
      onClick={connect}
      sx={{
        color: "#0000FF",
        width: "210px",
        ...sx,
      }}
    >
      {displayedName}
    </Button>
  );
}

export default ConnectButton;
