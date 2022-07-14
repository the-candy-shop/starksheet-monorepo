import React from "react";
import GreyCell, { GreyCellProps } from "../GreyCell/GreyCell";
import { BoxProps } from "@mui/material";

export type ButtonProps = GreyCellProps & {
  disabled?: boolean;
  onClick: BoxProps["onClick"];
};

function Button({ children, onClick, disabled = false, sx }: ButtonProps) {
  return (
    <GreyCell
      onClick={!disabled ? onClick : undefined}
      sx={{
        cursor: !disabled ? "pointer" : "not-allowed",
        "& .content": { justifyContent: "center" },
        ...sx,
      }}
    >
      {children}
    </GreyCell>
  );
}

export default Button;
