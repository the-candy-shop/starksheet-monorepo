import React from "react";
import GreyCell, { GreyCellProps } from "../GreyCell/GreyCell";
import { BoxProps } from "@mui/material";

export type ButtonProps = GreyCellProps & {
  onClick: BoxProps["onClick"];
};

function Button({ children, onClick, sx }: ButtonProps) {
  return (
    <GreyCell
      onClick={onClick}
      sx={{ cursor: "pointer", justifyContent: "center", ...sx }}
    >
      {children}
    </GreyCell>
  );
}

export default Button;
