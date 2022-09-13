import { useStarknet } from "@starknet-react/core";
import { useMemo } from "react";
import { toBN } from "starknet/utils/number";
import { CELL_BORDER_WIDTH, CELL_WIDTH } from "../../config";
import Tooltip from "../../Tooltip/Tooltip";
import { RC_BOUND } from "../ActionBar/formula.utils";
import Cell from "../Cell/Cell";

const BLUE = "#0000FF";
const GREY = "#DEE5F0";
const RED = "#FF4F0A";

export type ComputedCellProps = {
  name: string;
  id: number;
  contractAddress: string;
  value?: string;
  owner?: string;
  selected: boolean;
  error?: boolean;
  setSelectedCell: (value: { name: string; id: number } | null) => void;
};

function buildBackground(
  cellOwner: string | undefined,
  account: string | undefined,
  value: string | undefined,
  contractAddess: string
): string {
  if (!cellOwner && value === "0" && contractAddess === RC_BOUND.toString())
    return "white";
  if (value === undefined) return "white";
  if (
    account === cellOwner ||
    (cellOwner === undefined &&
      (!toBN(value).eq(toBN(0)) || !toBN(contractAddess).eq(RC_BOUND)))
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

function buildValue(
  background: string,
  error?: boolean,
  value?: string
): string {
  if (error) return "ERROR";
  if (background === "white") return "";
  return value || "";
}

function ComputedCell({
  name,
  id,
  contractAddress,
  value,
  owner,
  selected,
  setSelectedCell,
  error,
}: ComputedCellProps) {
  const { account } = useStarknet();

  const background = useMemo(
    () => buildBackground(owner, account, value, contractAddress),
    [owner, account, value, contractAddress]
  );

  const borderColor = useMemo(
    () => buildSelectionBorderColor(background),
    [background]
  );

  const displayedValue = useMemo(
    () => buildValue(background, error, value),
    [background, error, value]
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
          {displayedValue}
        </Cell>
      </span>
    </Tooltip>
  );
}

export default ComputedCell;
