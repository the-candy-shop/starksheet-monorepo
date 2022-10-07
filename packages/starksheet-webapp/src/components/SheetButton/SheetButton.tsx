import { useContext } from "react";
import { AppStatusContext } from "../../contexts/AppStatusContext";
import { StarksheetContext } from "../../contexts/StarksheetContext";
import { Sheet } from "../../types";
import GreyCell, { GreyCellProps } from "../GreyCell/GreyCell";

export type SheetButtonProps = {
  sheet: Sheet;
  index: number;
  sx?: GreyCellProps["sx"];
};

export function SheetButton({ sheet, index, sx }: SheetButtonProps) {
  const { selectedSheet, setSelectedSheet } = useContext(StarksheetContext);
  const { updateAppStatus } = useContext(AppStatusContext);

  const onClick = () => {
    setSelectedSheet(index);
    updateAppStatus({ message: "", loading: true });
  };

  return (
    <GreyCell
      onClick={onClick}
      sx={{
        cursor: "pointer",
        color: index === selectedSheet ? "black" : "rgba(0,0,0,0.5)",
        width: "146px",
        "& .content": { justifyContent: "center" },
        ...sx,
      }}
    >
      {sheet.name}
    </GreyCell>
  );
}
