import { BoxProps } from "@mui/material";
import GreyCell, { GreyCellProps } from "../GreyCell/GreyCell";

export type ButtonProps = GreyCellProps & {
  disabled?: boolean;
  onClick: BoxProps["onClick"];
};

function Button({
  children,
  onClick,
  disabled = false,
  sx,
  variant = "1",
}: ButtonProps) {
  return (
    <GreyCell
      onClick={!disabled ? onClick : undefined}
      sx={{
        cursor: !disabled ? "pointer" : "not-allowed",
        "& .content": { justifyContent: "center" },
        ...sx,
      }}
      variant={variant}
    >
      {children}
    </GreyCell>
  );
}

export default Button;
