import React, { useMemo } from "react";
import { CELL_BORDER_WIDTH, CELL_WIDTH } from "../../config";
import Cell from "../Cell/Cell";
import { useStarknet } from "@starknet-react/core";
import Tooltip from "../../Tooltip/Tooltip";

export type ComputedCellProps = {
  name: string;
  id: number;
  value?: string;
  owner?: string;
  selected: boolean;
  setSelectedCell: (value: { name: string; id: number } | null) => void;
};

function buildBackground(
  cellOwner: string | undefined,
  account: string | undefined
): string {
  if (!cellOwner) return "white";
  if (!account || cellOwner !== account) return "#DEE5F0";
  return "#0000FF";
}

function buildSelectionBorderColor(
  cellOwner: string | undefined,
  account: string | undefined
): string {
  if (!cellOwner) return "#0000FF";
  if (!account || cellOwner !== account) return "#0000FF";
  return "#FF4F0A";
}
function buildColor(
  cellOwner: string | undefined,
  account: string | undefined
): string {
  if (!cellOwner) return "black";
  if (!account || cellOwner !== account) return "black";
  return "white";
}

function ComputedCell({
  name,
  id,
  value,
  owner,
  selected,
  setSelectedCell,
}: ComputedCellProps) {
  const { account } = useStarknet();

  const background = useMemo(
    () => buildBackground(owner, account),
    [owner, account]
  );
  const borderColor = useMemo(
    () => buildSelectionBorderColor(owner, account),
    [owner, account]
  );
  const color = useMemo(() => buildColor(owner, account), [owner, account]);

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
          {!!owner ? value : ""}
        </Cell>
      </span>
    </Tooltip>
  );
}

export default ComputedCell;
