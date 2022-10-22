import { useContext } from "react";
import { AppStatusContext } from "../../contexts/AppStatusContext";
import { StarksheetContext } from "../../contexts/StarksheetContext";
import { Sheet } from "../../types";
import GreyCell, { GreyCellProps } from "../GreyCell/GreyCell";
import LoadingDots from "../LoadingDots/LoadingDots";

export type SheetButtonProps = {
  sheet: Sheet;
  index: number;
  sx?: GreyCellProps["sx"];
};

export function SheetButton({ sheet, index, sx }: SheetButtonProps) {
  const { selectedSheet, setSelectedSheet } = useContext(StarksheetContext);
  const { appStatus } = useContext(AppStatusContext);

  const onClick = () => {
    setSelectedSheet(index);
  };

  return (
    <GreyCell
      onClick={onClick}
      sx={{
        cursor: "pointer",
        color: index === selectedSheet ? "black" : "rgba(0,0,0,0.5)",
        width: `${appStatus.sheets[sheet.address].loading ? 166 : 146}px`,
        "& .content": { justifyContent: "center", paddingX: "10px" },
        ...sx,
      }}
    >
      {sheet.name}
      {appStatus.sheets[sheet.address].loading && <LoadingDots />}
    </GreyCell>
  );
}
