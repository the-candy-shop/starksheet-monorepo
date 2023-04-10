import { useContext } from "react";
import { Link } from "react-router-dom";
import { AppStatusContext } from "../../contexts/AppStatusContext";
import { OnsheetContext } from "../../contexts/OnsheetContext";
import { Sheet } from "../../types";
import GreyCell, { GreyCellProps } from "../GreyCell/GreyCell";
import LoadingDots from "../LoadingDots/LoadingDots";

export type SheetButtonProps = {
  sheet: Sheet;
  index: number;
  sx?: GreyCellProps["sx"];
};

export function SheetButton({ sheet, index, sx }: SheetButtonProps) {
  const { selectedSheetIndex, setSelectedSheetAddress } =
    useContext(OnsheetContext);
  const { appStatus } = useContext(AppStatusContext);

  const onClick = () => {
    setSelectedSheetAddress(sheet.address);
  };

  return (
    <GreyCell
      onClick={onClick}
      sx={{
        cursor: "pointer",
        color: index === selectedSheetIndex ? "black" : "rgba(0,0,0,0.5)",
        width: `${appStatus.sheets[sheet.address].loading ? 166 : 146}px`,
        "& .content": { justifyContent: "center", paddingX: "10px" },
        ...sx,
      }}
    >
      <Link
        to={`/${sheet.address}`}
        style={{ color: "inherit", textDecoration: "inherit" }}
      >
        {sheet.name}
      </Link>
      {appStatus.sheets[sheet.address].loading && <LoadingDots />}
    </GreyCell>
  );
}
