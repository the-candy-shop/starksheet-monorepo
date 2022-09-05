import { useStarknet } from "@starknet-react/core";
import { useMemo } from "react";
import { toBN } from "starknet/utils/number";
import { CELL_BORDER_WIDTH, CELL_WIDTH } from "../../config";
import Tooltip from "../../Tooltip/Tooltip";
import Cell from "../Cell/Cell";

const BLUE = "#0000FF";
const GREY = "#DEE5F0";
const RED = "#FF4F0A";

export type ComputedCellProps = {
  name: string;
  id: number;
  value?: string;
  owner?: string;
  selected: boolean;
  error?: boolean;
  setSelectedCell: (value: { name: string; id: number } | null) => void;
};

function buildBackground(
  cellOwner: string | undefined,
  account: string | undefined,
  value: string | undefined
): string {
  if (!cellOwner && value === "0") return "white";
  if (
    account === cellOwner ||
    (cellOwner === undefined && !toBN(value || "0").eq(toBN(0)))
  )
    return BLUE;
  return GREY;
}

function buildSelectionBorderColor(background: string): string {
  if (background === BLUE) return RED;
  return BLUE;
}

function buildColor(background: string): string {
  if (background === BLUE) return "white";
  return "black";
}

function ComputedCell({
  name,
  id,
  value,
  owner,
  selected,
  setSelectedCell,
  error,
}: ComputedCellProps) {
  const { account } = useStarknet();

  const background = useMemo(
    () => buildBackground(owner, account, value),
    [owner, account, value]
  );

  const borderColor = useMemo(
    () => buildSelectionBorderColor(background),
    [background]
  );

  const color = useMemo(() => buildColor(background), [background]);

  return (
    <Tooltip title={value && value.length > 4 ? value : false} followCursor>
      <span>
        <Cell
          key={name}
          selected={selected}
          onClick={() => setSelectedCell({ name, id })}
          sx={{
            width: `${CELL_WIDTH}px`,
            minWidth: `${CELL_WIDTH}px`,
            maxWidth: `${CELL_WIDTH}px`,
            marginLeft: `-${CELL_BORDER_WIDTH}px`,
            textAlign: "center",
            background,
            color,

            "& .selection": {
              borderColor,
            },

            "& .selection-square": {
              background: borderColor,
            },
          }}
        >
          {error ? "ERROR" : !!owner || value !== "0" ? value : ""}
        </Cell>
      </span>
    </Tooltip>
  );
}

export default ComputedCell;
