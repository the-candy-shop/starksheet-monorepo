import Tooltip from "../../Tooltip/Tooltip";
import Button from "../Button/Button";
import { BoxProps } from "@mui/material";

export type BridgeButtonProps = {
  onClick: () => void;
  sx?: BoxProps["sx"];
};

function BridgeButton({ onClick, sx }: BridgeButtonProps) {
  return (
    <Tooltip title={false} followCursor>
      <span>
        <Button
          sx={{
            width: "151px",
            "& .content": {
              backgroundColor: "#3fdea9",
              boxShadow:
                "inset -5px -5px 3px #56f5c0, inset 5px 5px 3px #258867",
              justifyContent: "center",
              textAlign: "center",
            },
            ...sx,
          }}
          onClick={onClick}
        >
          Bridge
        </Button>
      </span>
    </Tooltip>
  );
}

export default BridgeButton;
