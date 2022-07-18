import React from "react";
import {
  Tooltip as MuiTooltip,
  TooltipProps as MuiTooltipProp,
  styled,
} from "@mui/material";

export type TooltipProps = MuiTooltipProp;

const Tooltip = styled(
  ({ className, children, title, ...props }: TooltipProps) =>
    title ? (
      <MuiTooltip
        title={title}
        {...props}
        componentsProps={{ tooltip: { className: className } }}
      >
        {children}
      </MuiTooltip>
    ) : (
      children
    )
)(`
    background-color: #F0DCA8;
    font-size: 14px;
    font-family: 'Press Start 2P',cursive;
    color: black;
    border: 2px solid black;
    border-radius: 0;
    text-align: center;
`);

export default Tooltip;
