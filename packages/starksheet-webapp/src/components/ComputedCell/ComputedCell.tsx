import { useContext, useMemo } from "react";
import { constants } from "starknet";
import { toBN } from "starknet/utils/number";
import { CELL_BORDER_WIDTH, CELL_WIDTH } from "../../config";
import { AccountContext } from "../../contexts/AccountContext";
import Tooltip from "../../Tooltip/Tooltip";
import { Cell as CellType } from "../../types";
import { RC_BOUND, starksheetContractData } from "../../utils/constants";
import { bn2hex, hex2str } from "../../utils/hexUtils";
import Cell from "../Cell/Cell";

const BLUE = "#0000FF";
const GREY = "#DEE5F0";
const RED = "#FF4F0A";
const BLACK = "black";
const WHITE = "white";
const GREEN = "#00FF00";

export type ComputedCellProps = {
  name: string;
  id: number;
  selected: boolean;
  cell: CellType;
  setSelectedCell: (value: { name: string; id: number } | null) => void;
};

function ComputedCell({
  name,
  id,
  selected,
  setSelectedCell,
  cell,
}: ComputedCellProps) {
  const { accountAddress } = useContext(AccountContext);

  const { background, borderColor, color } = useMemo(() => {
    const background =
      cell.owner.eq(toBN(0)) &&
      cell.contractAddress.eq(RC_BOUND) &&
      cell.selector.eq(toBN(0))
        ? WHITE
        : cell.abi && cell.abi?.stateMutability !== "view"
        ? GREEN
        : accountAddress === bn2hex(cell.owner) ||
          (cell.owner.eq(toBN(0)) &&
            !(cell.contractAddress.eq(RC_BOUND) && cell.selector.eq(toBN(0))))
        ? BLUE
        : GREY;

    const borderColor =
      background === BLUE || background === GREEN ? RED : BLUE;
    const color = background === BLUE ? WHITE : BLACK;
    return { background, borderColor, color };
  }, [cell, accountAddress]);

  const value = useMemo(() => {
    if (background === GREEN) return cell.abi?.name;
    if (background === WHITE) return "";
    if (cell.error) return "ERROR";

    const value = cell.value;
    if (cell.abi?.name === "name" || cell.abi?.name === "symbol") {
      return hex2str(bn2hex(value));
    }
    if (cell.contractAddress.eq(toBN(starksheetContractData.mathAddress))) {
      return value
        .add(
          toBN("0x" + constants.FIELD_PRIME)
            .div(toBN(2))
            .abs()
        )
        .mod(toBN("0x" + constants.FIELD_PRIME))
        .sub(
          toBN("0x" + constants.FIELD_PRIME)
            .div(toBN(2))
            .abs()
        )
        .toString();
    }
    if (value.gte(RC_BOUND)) return bn2hex(value);
    return value.toString();
  }, [cell, background]);

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
          {value}
        </Cell>
      </span>
    </Tooltip>
  );
}

export default ComputedCell;
